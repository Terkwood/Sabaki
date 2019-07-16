/// BUGOUT support for "gtp-like" multiplayer coordination

const EventEmitter = require('events')
const Board = require('../board')
const RobustWebSocket = require('robust-websocket')
const uuidv4 = require('uuid/v4')

const GATEWAY_HOST_LOCAL = "ws://localhost:3012/gateway"
const GATEWAY_HOST_REMOTE = "wss://your.host.here:443/gateway"
const GATEWAY_HOST = GATEWAY_HOST_LOCAL

const GATEWAY_BEEP_TIMEOUT_MS = 13333

class Controller extends EventEmitter {
    constructor(path, args = [], spawnOptions = {}) {
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
        
        this._webSocketController = new WebSocketController(GATEWAY_HOST, this.args)
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

class WebSocketController extends EventEmitter {
    constructor(webSocketAddress, args) {
        super()
        this.waitForBlack = args && args.length > 0 && args[0] === "WAIT_FOR_BLACK"
        
        // TODO BUGOUT don't hardcode this
        this.board = new Board(19,19)
        this.gameId = null
        this.deadlockMonitor = new DeadlockMonitor()

        this.beeping = true
        setTimeout(() => this.beep(), GATEWAY_BEEP_TIMEOUT_MS)

        this.webSocketAddress = webSocketAddress
        this.webSocket = new RobustWebSocket(webSocketAddress)
        this.gatewayConn = new GatewayConn(this.webSocket)

        this.webSocket.addEventListener('close', event => {
            console.log("WebSocket closed.")
        })

        this.webSocket.addEventListener('error',event => {
            console.log(`WebSocket error ${JSON.stringify(event)}`)
        })

        this.webSocket.addEventListener('open', () => {
            if (!this.gameId) {
                this.gatewayConn
                    .requestGameId()
                    .then((reply, err) => {
                        if (!err) {
                            this.gameId = reply.gameId
                        } else {
                            console.log('FATAL ERROR - WE DO NOT HAVE A GAME ID')
                        }
                })
            } else {
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
                    console.log(":-D TRIGGERED :-D")
                    let sabakiCoord = this.board.vertex2coord([msg.coord.x, msg.coord.y])
                    resolve({"id":null,"content":sabakiCoord,"error":false})
                    this.deadlockMonitor.emit(
                        'they-moved', 
                        { playerUp: otherPlayer(opponent) }
                    )
                    console.log("grats?")
                }

                // discard any other messages until we receive confirmation
                // from BUGOUT that the move was made
            } catch (err) {
                console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                resolve({"id": null, "content": "", "error": true})
            }
        })
        this.deadlockMonitor.emit('waiting', { playerUp: opponent })
    }

    async sendCommand(command, subscriber = () => {}) {
        console.log(`GTP command ${JSON.stringify(command)}`)
        let promise = new Promise((resolve, reject) => {
            if (!this.gameId) {
                console.log('no game id')
                reject({id: null, error: true})
            }

            if (command.name == "play") {
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
                this.listenForMove(opponent, resolve)
             } else {
                 console.log(`catchall command in controller ${command.name}`)
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
        console.log("gatewayconn reconnect")
        return new Promise((resolve, reject) => {
            try { 
                let reconnectCommand = {
                    "type":"Reconnect",
                    "gameId": gameId,
                    "reqId": uuidv4()
                }

                console.log(`sending ${JSON.stringify(reconnectCommand)}`)
                this.webSocket.onmessage = event => {
                    try {
                        let msg = JSON.parse(event.data)
                        console.log(`message after reconnect: ${event.data}`)
                        if (msg.type === "Reconnected") {
                            resolve({ playerUp: msg.playerUp })
                        }

                        // listens for _any_ player to move ...
                        if (resolveMoveMade && msg.type == "MoveMade") {
                            let sabakiCoord = board.vertex2coord([msg.coord.x, msg.coord.y])
                            console.log("MOVE MADE ON RECONNECT")
                            resolveMoveMade({"id":null,"content":sabakiCoord,"error":false})
                        }

                        // discard any other messages
                    } catch (err) {
                        console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                        resolve({error: true})
                    }
                }
                this.webSocket.send(JSON.stringify(reconnectCommand))
            } catch (err) {
                reject(err)
            }
        })
    }

    async requestGameId() {
        return new Promise((resolve, reject) => {
            let requestGameId = {
                "type":"RequestOpenGame",
                "reqId": uuidv4()
            }

            this.webSocket.addEventListener('message', event => {
                try {
                    let msg = JSON.parse(event.data)
                    console.log(`incoming data ${event.data}`)
                    if (msg.type === "OpenGameReply" && msg.replyTo === requestGameId.reqId) {
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
