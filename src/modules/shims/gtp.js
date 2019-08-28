/// BUGOUT support for "gtp-like" multiplayer coordination

const EventEmitter = require('events')
const Board = require('../board')
const RobustWebSocket = require('robust-websocket')
const uuidv4 = require('uuid/v4')
const { EntryMethod } = require('../bugout')

const GATEWAY_HOST_LOCAL = "ws://localhost:3012/gateway"
const GATEWAY_HOST_REMOTE = "wss://your.host.here:443/gateway"
const GATEWAY_HOST = GATEWAY_HOST_LOCAL

const GATEWAY_BEEP_TIMEOUT_MS = 13333

class Controller extends EventEmitter {
    constructor(path, args = [], spawnOptions = {
        joinPrivateGame: { join: false },
        entryMethod: EntryMethod.FIND_PUBLIC
    }) {
        super()

        this.path = path
        this.args = args
        this.spawnOptions = spawnOptions
        
        this._webSocketController = null
    }

    get busy() {
        return this._webSocketController != null && this._webSocketController.busy
    }

    start() {
        if (this._webSocketController != null) return
        
        this._webSocketController = new WebSocketController(GATEWAY_HOST, this.spawnOptions)
        this._webSocketController.on('command-sent', evt => this.emit('command-sent', evt))
        this._webSocketController.on('response-received', evt => this.emit('response-received', evt))

        this.emit('started')
    }


    async stop(timeout = 3000) {
        if (this._webSocketController == null) return

        return new Promise(async resolve => {
            this.kill()
            resolve()
        }, timeout)
    }

    kill() {
        if (this._webSocketController == null) return

        this._webSocketController.stop()
    }

    async sendCommand(command, subscriber = () => {}) {
        if (this.webSocket == null) this.start()

        return await this._webSocketController.sendCommand(command, subscriber)
    }
}

const Command = { 
    fromString: function(input) {
        input = input.replace(/#.*?$/, '').trim()

        let inputs = input.split(/\s+/)
        let id = parseInt(inputs[0], 10)

        if (!isNaN(id) && id + '' === inputs[0]) inputs.shift()
        else id = null

        let [name, ...args] = inputs
        return {id, name, args}
    },
    toString: function({id = null, name, args = []}) {
        return `${id != null ? id : ''} ${name} ${args.join(' ')}`.trim()
    }
}

const letterToPlayer = letter =>  letter === "B" ? "BLACK" : "WHITE"
const otherPlayer = p => p[0] === "B" ? "WHITE" : "BLACK"

const FATAL_ERROR = 'Fatal error'
const throwFatal = () => {
    alert(FATAL_ERROR)
    throw FATAL_ERROR
}

class WebSocketController extends EventEmitter {
    constructor(webSocketAddress, spawnOptions) {
        super()

        this.board = new Board(19,19) // TODO BUGOUT don't hardcode this
        this.gameId = null
        this.deadlockMonitor = new DeadlockMonitor()

        this.beeping = true
        setTimeout(() => this.beep(), GATEWAY_BEEP_TIMEOUT_MS)

        this.webSocketAddress = webSocketAddress
        this.webSocket = new RobustWebSocket(webSocketAddress)
        this.gatewayConn = new GatewayConn(this.webSocket)

        let { joinPrivateGame, entryMethod } = spawnOptions
        this.joinPrivateGame = joinPrivateGame
        this.entryMethod = entryMethod

        // If it's the first move, and we're white,
        // we'll always request history first. (In case
        // black has already moved.)
        this.firstMove = true

        this.webSocket.addEventListener('close', event => {
            console.log("WebSocket closed.")
        })

        this.webSocket.addEventListener('error',event => {
            console.log(`WebSocket error ${JSON.stringify(event)}`)
        })

        this.webSocket.addEventListener('open', () => {
            if (!this.gameId && this.entryMethod === EntryMethod.FIND_PUBLIC) {
                console.log('! FIND PUBLIC')
                this.gatewayConn
                    .findPublicGame()
                    .then((reply, err) => {
                        if (!err && reply.type === 'GameReady') {
                            console.log(`+ PUBLIC GAME READY`)
                            this.gameId = reply.gameId
                        } else if (!err && reply.type == 'WaitForOpponent') {
                            console.log('⏳ WaitForOpponent ⌛️')
                        } else {
                            throwFatal()
                        }
                })
            } else if (!this.gameId && this.entryMethod === EntryMethod.CREATE_PRIVATE) {
                console.log('! CREATE PRIVATE')
                this.gatewayConn
                    .createPrivateGame()
                    .then((reply, err) => {
                        if (!err && reply.type == 'WaitForOpponent') {
                            console.log('⏳ WaitForOpponent ⌛️')
                        } else {
                            throwFatal()
                        }
                })
            } else if (!this.gameId && this.entryMethod === EntryMethod.JOIN_PRIVATE && this.joinPrivateGame.join) {
                console.log('! JOIN PRIVATE')
                this.gatewayConn
                    .joinPrivateGame(this.joinPrivateGame.gameId)
                    .then((reply, err) => {
                        if (!err && reply.type === 'GameReady') {
                            this.gameId = reply.gameId
                        } else if (!err && reply.type == 'PrivateGameRejected') {
                            alert('Invalid game')
                        } else {
                            throwFatal()
                        }
                    })
            } else {
                console.log('! ELSE RECONN')
                this.gatewayConn
                    .reconnect(this.gameId, this.resolveMoveMade, this.board)
                    .then((rc, err) => {
                        console.log(`Reconnected! playerUp: ${rc.playerUp}`)
                        this.deadlockMonitor.emit('reconnected', { playerUp: rc.playerUp })
                    })
            }
        })

        // reconnect event
        this.webSocket.addEventListener('connecting', () => {
            console.log('Reconnecting...')
        })
    }

    listenForMove(opponent, resolve) {
        this.resolveMoveMade = resolve
        this.webSocket.addEventListener('message', event => {
            try {
                let msg = JSON.parse(event.data)
                if (msg.type === "MoveMade" && msg.player === opponent) {
                    let sabakiCoord = this.board.vertex2coord([msg.coord.x, msg.coord.y])
                    resolve({"id":null,"content":sabakiCoord,"error":false})
                    this.deadlockMonitor.emit(
                        'they-moved', 
                        { playerUp: otherPlayer(opponent) }
                    )
                }

                // discard any other messages until we receive confirmation
                // from BUGOUT that the move was made
            } catch (err) {
                console.log(`Error processing websocket message (M): ${JSON.stringify(err)}`)
                resolve({"id": null, "content": "", "error": true})
            }
        })
        this.deadlockMonitor.emit('waiting', { playerUp: opponent })
    }


    listenForHistoryFirstMove(opponent, onFirstMove) {
        this.webSocket.addEventListener('message', event => {
            try {
                let msg = JSON.parse(event.data)
                if (msg.type === "HistoryProvided" &&
                    msg.moves.length > 0 &&
                    msg.moves[msg.moves.length - 1].player === opponent &&
                    msg.moves[msg.moves.length - 1].turn === 1) {
                    let lastMove = msg.moves[msg.moves.length - 1]
                    if (lastMove) { // they didn't pass
                        let sabakiCoord = this.board.vertex2coord([lastMove.coord.x, lastMove.coord.y])

                        onFirstMove({player: lastMove.player, resolveWith: {"id":null,"content":sabakiCoord,"error":false}})
                    } else {
                        // This may fail.  Revisit after https://github.com/Terkwood/BUGOUT/issues/56
                        onFirstMove({player: lastMove.player, resolveWith:{"id":null,"content":null,"error":false}})
                    } 
                }

                if (msg.type === "HistoryProvided") {
                    // a history was provided, but it's the current player's turn, or there's no history: carry on
                    onFirstMove({resolveWith: undefined})
                }

                // discard any other messages until we receive confirmation
                // from BUGOUT that the history was provided
            } catch (err) {
                console.log(`Error processing websocket message (H): ${JSON.stringify(err)}`)
                onFirstMove(undefined)
            }
        })
    }


    async sendCommand(command, subscriber = () => {}) {
        let promise = new Promise((resolve, reject) => {
            if (!this.gameId) {
                console.log(`no game id: ignoring command ${command}`)
                reject({id: null, error: true})
            }

            if (command.name == "play") {
                this.firstMove = false // no need to listen for history
                let player = letterToPlayer(command.args[0])
                let vertex = this.board.coord2vertex(command.args[1])

                let makeMove = {
                    "type":"MakeMove",
                    "gameId": this.gameId,
                    "reqId": uuidv4(),
                    "player":player,
                    "coord": {"x":vertex[0],"y":vertex[1]}
                }

                this.webSocket.addEventListener('message', event => {
                    try {
                        let msg = JSON.parse(event.data)
                        if (msg.type === "MoveMade" && msg.replyTo === makeMove.reqId) {
                            this.resolveMoveMade = undefined
                            resolve({id: null, error: false})
                            this.deadlockMonitor.emit('we-moved', { playerUp: otherPlayer(player) })
                        }

                        // discard any other messages until we receive confirmation
                        // from BUGOUT that the move was made
                    } catch (err) {
                        console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                        resolve({ok: false})
                    }
                })

                this.webSocket.send(JSON.stringify(makeMove))
            } else if (command.name === "genmove") {
                let opponent = letterToPlayer(command.args[0])
                if (opponent === "BLACK" && this.firstMove) {
                    let provideHistoryCommand = {
                        "type":"ProvideHistory",
                        "gameId": this.gameId,
                        "reqId": uuidv4()
                    }
                    this.webSocket.send(JSON.stringify(provideHistoryCommand))
                    
                    let onFirstMove = response => {
                        this.firstMove = false
                        if (response.resolveWith != undefined) {
                            // black moved
                            resolve(response.resolveWith)
                        } else {
                            // it wasn't black
                            this.listenForMove(opponent, resolve)
                        }
                    }
                    this.listenForHistoryFirstMove(opponent, onFirstMove)                    
                } else {
                    this.listenForMove(opponent, resolve)
                }
             } else {
                 resolve({id: null, err: false})
             }
        })

        this.emit('command-sent', {
            command,
            subscribe: f => {
                let g = subscriber
                subscriber = x => (f(x), g(x))
            },
            getResponse: () => promise
        })

        return promise
    }

    async beep() {
        if (this.beeping) {
            const pingMsg = { "type": "Beep" }
            this.webSocket.send(JSON.stringify(pingMsg))
            setTimeout(() => this.beep(), GATEWAY_BEEP_TIMEOUT_MS)
        }
    }

    stop() {
        this.webSocket.close()
        this.beeping = false
    }
}

class GatewayConn {
    constructor(webSocket) {
        this.webSocket = webSocket
    }


    async reconnect(gameId, resolveMoveMade, board) {
        return new Promise((resolve, reject) => {
            try { 
                let reconnectCommand = {
                    "type":"Reconnect",
                    "gameId": gameId,
                    "reqId": uuidv4()
                }

                this.webSocket.onmessage = event => {
                    try {
                        let msg = JSON.parse(event.data)
                        if (msg.type === "Reconnected") {
                            resolve({ playerUp: msg.playerUp })
                        }

                        // listens for _any_ player to move ...
                        if (resolveMoveMade && msg.type == "MoveMade") {
                            let sabakiCoord = board.vertex2coord([msg.coord.x, msg.coord.y])
                            
                            resolveMoveMade({"id":null,"content":sabakiCoord,"error":false})
                        }

                        // discard any other messages
                    } catch (err) {
                        console.log(`Error processing websocket message (R): ${JSON.stringify(err)}`)
                        resolve({error: true})
                    }
                }
                this.webSocket.send(JSON.stringify(reconnectCommand))
            } catch (err) {
                reject(err)
            }
        })
    }

    async findPublicGame() {
        return new Promise((resolve, reject) => {
            let requestPayload = {
                'type':'FindPublicGame'
            }

            this.webSocket.addEventListener('message', event => {
                try {
                    let msg = JSON.parse(event.data)

                    if (msg.type === 'GameReady') {
                        resolve(msg)
                    } else if (msg.type === 'WaitForOpponent') {
                        resolve(msg)
                    }
                    // discard any other messages
                } catch (err) {
                    console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                }
                console.log('x FPG REJECT')
                reject()
            })

            this.webSocket.send(JSON.stringify(requestPayload))
        })
    }

    async createPrivateGame() {
        return new Promise((resolve, reject) => {
            let requestPayload = {
                'type':'CreatePrivateGame'
            }

            this.webSocket.addEventListener('message', event => {
                try {
                    let msg = JSON.parse(event.data)

                    if (msg.type === 'WaitForOpponent') {
                        resolve(msg)
                    }
                    // discard any other messages
                } catch (err) {
                    console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                }
                reject()
            })

            this.webSocket.send(JSON.stringify(requestPayload))
        })
    }

    async joinPrivateGame(gameId) {
        return new Promise((resolve, reject) => {
            let requestPayload = {
                'type':'JoinPrivateGame',
                'gameId': gameId
            }

            this.webSocket.addEventListener('message', event => {
                try {
                    let msg = JSON.parse(event.data)

                    if (msg.type === 'GameReady') {
                        resolve(msg)
                    } else if (msg.type === 'PrivateGameRejected') {
                        resolve(msg)
                    }
                    // discard any other messages
                } catch (err) {
                    console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                }
                reject()
            })

            this.webSocket.send(JSON.stringify(requestPayload))
        })
    }

    async requestGameId() {
        return new Promise((resolve, reject) => {
            let requestGameId = {
                'type':'RequestOpenGame',
                'reqId': uuidv4()
            }

            this.webSocket.addEventListener('message', event => {
                try {
                    let msg = JSON.parse(event.data)
                    
                    if (msg.type === 'OpenGameReply' && msg.replyTo === requestGameId.reqId) {
                        resolve({gameId: msg.gameId})
                    }
                    // discard any other messages
                } catch (err) {
                    console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                    reject()
                }
            })

            this.webSocket.send(JSON.stringify(requestGameId))
        })
    }
}

class DeadlockMonitor extends EventEmitter {
    constructor() {
        super()

        this.playerUp = "BLACK"
        this.on('we-moved', evt => this.playerUp = evt.playerUp)
        this.on('they-moved', evt => this.playerUp = evt.playerUp)
        this.on('waiting', evt => this.playerUp = evt.playerUp)
        this.on('reconnected', evt => {
            if (evt.playerUp !== this.playerUp) {
                alert("⚰️ DEADLOCK... ☠️ ...GAMEOVER ⚰️")
            }
        })
    }
}

exports.Controller = Controller
exports.Command = Command
exports.letterToPlayer = letterToPlayer
