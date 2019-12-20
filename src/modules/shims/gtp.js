/// BUGOUT support for "gtp-like" multiplayer coordination

const EventEmitter = require('events')
const Board = require('../board')
const RobustWebSocket = require('robust-websocket')
const uuidv4 = require('uuid/v4')
const { IdleStatus, EntryMethod, emitReadyState } = require('../bugout')

const GATEWAY_HOST_LOCAL = "ws://localhost:3012/gateway"
const GATEWAY_HOST_REMOTE = "wss://your.host.here:443/gateway"
const GATEWAY_HOST = GATEWAY_HOST_LOCAL

const GATEWAY_BEEP_TIMEOUT_MS = 13333

const IDLE_STATUS_POLL_MS = 1000

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

/** 
 * We've found that longer timeout allows for more stable
 * overall behavior.  It can take a long time for spotty
 * wi-fi to reestablish, and we don't want RobustWebSocket
 * giving up too early.
 */
const ROBUST_WEBSOCKET_TIMEOUT_MS = 300000

const WEBSOCKET_HEALTH_DELAY_MS = 10000
const WEBSOCKET_HEALTH_INTERVAL_MS = 100

const opponentMoved = (msg, opponent) => msg.type === "MoveMade" && msg.player === opponent

class WebSocketController extends EventEmitter {
    constructor(webSocketAddress, spawnOptions) {
        super()

        this.board = new Board(19,19) // See https://github.com/Terkwood/BUGOUT/issues/103
        this.gameId = null

        this.beeping = true
        setTimeout(() => this.beep(), GATEWAY_BEEP_TIMEOUT_MS)

        this.webSocketAddress = webSocketAddress
        this.webSocket = new RobustWebSocket(webSocketAddress, null, { timeout: ROBUST_WEBSOCKET_TIMEOUT_MS })

        let { joinPrivateGame, entryMethod, handleWaitForOpponent, handleYourColor } = spawnOptions.multiplayer
        this.joinPrivateGame = joinPrivateGame
        this.entryMethod = entryMethod

        setTimeout(() => setInterval(() => {
            emitReadyState(this.webSocket, sabaki.events)
        }, WEBSOCKET_HEALTH_INTERVAL_MS), WEBSOCKET_HEALTH_DELAY_MS)
        
        // We pass handleWaitForOpponent down so that it can 'stick'
        // to the incoming websocket message, even after an initial WFP
        // result is returned via findPublicGame() and createPrivateGame() funcs
        this.gatewayConn = new GatewayConn(this.webSocket, handleWaitForOpponent, handleYourColor)

        sabaki.events.on('bugout-turn', ({ turn }) => this.turn = turn )

        this.webSocket.addEventListener('close', () => {
            this.removeMessageListener()
            console.log("WebSocket closed.")
            emitReadyState(this.webSocket, sabaki.events)
        })

        this.webSocket.addEventListener('error',event => {
            console.log(`WebSocket error ${JSON.stringify(event)}`)
            emitReadyState(this.webSocket, sabaki.events)
        })

        // support reconnect event
        this.webSocket.addEventListener('connecting', () => {
            this.removeMessageListener()
            emitReadyState(this.webSocket, sabaki.events)
        })

        this.webSocket.addEventListener('open', () => {
            this.removeMessageListener()
            emitReadyState(this.webSocket, sabaki.events)

            this.waitForBugoutOnline().then((rc, err) => {

                if (!this.gameId && this.entryMethod === EntryMethod.FIND_PUBLIC) {
                    this.gatewayConn
                        .findPublicGame()
                        .then((reply, err) => {
                            if (!err && reply.type === 'GameReady') {
                                this.gameId = reply.gameId
                            } else if (!err && reply.type == 'WaitForOpponent') {
                                this.gameId = reply.gameId
                            } else {
                                throwFatal()
                            }
                    })
                } else if (!this.gameId && this.entryMethod === EntryMethod.CREATE_PRIVATE) {
                    this.gatewayConn
                        .createPrivateGame()
                        .then((reply, err) => {
                            if (!err && reply.type == 'WaitForOpponent') {
                                this.gameId = reply.gameId
                            } else if (!err && reply.type === 'GameReady') {
                                // LATER...
                                this.gameId = reply.gameId
                            } else {
                                throwFatal()
                            }
                    })
                } else if (!this.gameId && this.entryMethod === EntryMethod.JOIN_PRIVATE && this.joinPrivateGame.join) {
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
                    this.gatewayConn
                        .reconnect(this.gameId, this.resolveMoveMade, this.board)
                        .then((rc, err) => {
                            if (!err) {
                                console.log(`Reconnected! data: ${JSON.stringify(rc)}`)

                                if (this.genMoveInProgress) {
                                    let provideHistoryCommand = {
                                        "type":"ProvideHistory",
                                        "gameId": this.gameId,
                                        "reqId": uuidv4()
                                    }
                                    
                                    this.webSocket.send(JSON.stringify(provideHistoryCommand))
                                    
                                    let onMove = r => {
                                        if (r && r.resolveWith) {
                                            // the opponent moved
                                            this.genMoveInProgress = false
                                            this.resolveMoveMade(r.resolveWith)
                                        }
                                    }
                                    this.listenForHistoryOrMove(this.opponent, onMove)                    
                                } else {
                                    this.listenForMove(this.opponent, this.resolveMoveMade)
                                }
                            } else {
                                throwFatal()
                            }
                        })
                    }
                })
            }
        )
    }

    removeMessageListener() {
        this.messageListener &&
        this.webSocket.removeEventListener('message', this.messageListener)
    }

    updateMessageListener(listener) {
        if (listener) {
            this.removeMessageListener()
            this.messageListener = listener
            this.webSocket.addEventListener('message', listener)
        }
    }

    listenForHistoryOrMove(opponent, onMove) {
        // We only want this listener online so we don't double-count turns
        this.updateMessageListener(event => {
            try {
                let msg = JSON.parse(event.data)
                console.log(`msg on the line ${JSON.stringify(msg)}`)
                console.log(`turn ${this.turn}`)

                if (msg.type === "HistoryProvided" &&
                    msg.moves.length > 0 &&
                    msg.moves[msg.moves.length - 1].player === opponent &&
                    msg.moves[msg.moves.length - 1].turn === this.turn) {

                    let lastMove = msg.moves[msg.moves.length - 1]
                    if (lastMove) { // they didn't pass
                        let sabakiCoord = this.board.vertex2coord([lastMove.coord.x, lastMove.coord.y])

                        onMove({player: lastMove.player, resolveWith: {"id":null,"content":sabakiCoord,"error":false}})
                    } else {
                        // This may fail.  Revisit after https://github.com/Terkwood/BUGOUT/issues/56
                        onMove({player: lastMove.player, resolveWith:{"id":null,"content":null,"error":false}})
                    }
                } else if (opponentMoved(msg,opponent)) {

                    this.handleMoveMade(msg,opponent)

                } else {
                    console.log('Unknown message')

                    // discard any other messages until we receive confirmation
                    // from BUGOUT that the history was provided
                }
            } catch (err) {
                console.log(`Error processing websocket message (H): ${JSON.stringify(err)}`)
                onMove(undefined)
            }
        })
    }

    listenForMove(opponent, resolve) {
        this.resolveMoveMade = resolve

        // We only want this listener online so we don't double-count turns
        this.updateMessageListener(event => {
            try {
                let msg = JSON.parse(event.data)
               
                if (opponentMoved(msg, opponent)) {
                    this.handleMoveMade(msg, opponent, resolve)
                    this.genMoveInProgress = false
                }

                // discard any other messages until we receive confirmation
                // from BUGOUT that the move was made
            } catch (err) {
                console.log(`Error processing websocket message (M): ${JSON.stringify(err)}`)
                resolve({"id": null, "content": "", "error": true})
            }
        })
    }

    handleMoveMade(msg, opponent, resolve) {
        let sabakiCoord = this.board.vertex2coord([msg.coord.x, msg.coord.y])

        resolve({"id":null,"content":sabakiCoord,"error":false})
        
        let playerUp = otherPlayer(opponent) 

        // In case white needs to dismiss its initial screen
        sabaki.events.emit('they-moved', { playerUp })
    }

    async sendCommand(command, subscriber = () => {}) {
        let promise = new Promise((resolve, reject) => {
            if (!this.gameId) {
                console.log(`no game id: ignoring command ${JSON.stringify(command)}`)
                reject({id: null, error: true})
            }

            if (command.name == "play") {
                let player = letterToPlayer(command.args[0])
                this.opponent = otherPlayer(player)

                let vertex = this.board.coord2vertex(command.args[1])

                let makeMove = {
                    "type":"MakeMove",
                    "gameId": this.gameId,
                    "reqId": uuidv4(),
                    "player":player,
                    "coord": {"x":vertex[0],"y":vertex[1]}
                }

                // We only want this listener online so we don't double-count turns
                this.updateMessageListener(event => {
                    try {
                        let msg = JSON.parse(event.data)
                        if (msg.type === "MoveMade" && msg.replyTo === makeMove.reqId) {
                            resolve({id: null, error: false})
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
                this.opponent = opponent
                
                this.listenForMove(opponent, resolve)
                this.genMoveInProgress = true
             
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

    async waitForBugoutOnline() {
        sabaki.events.on('idle-status', idleStatus => sabaki.setState({
            multiplayer: {
                ...sabaki.state.multiplayer,
                idleStatus
            }
        }))

        this.pollBugoutOnline()
        
        return new Promise((resolve, reject) => { 
            this.updateMessageListener(event => {
                try {
                    let msg = JSON.parse(event.data)

                    if (msg.type === 'IdleStatusProvided' && msg.status === IdleStatus.ONLINE) {
                        this.removeMessageListener()
                    
                        this.idleStatus = { status: msg.status }
                        if (this.idleStatusPoll) {
                            clearInterval(this.idleStatusPoll)
                        }
                        sabaki.events.emit('idle-status', this.idleStatus)

                        resolve(msg)
                    } else if (msg.type === 'IdleStatusProvided' && msg.status === IdleStatus.IDLE) {
                        
                        this.idleStatus = { status: msg.status, since: msg.since }
                        sabaki.events.emit('idle-status', this.idleStatus)
                    } else if (msg.type === 'IdleStatusProvided' && msg.status === IdleStatus.BOOTING) {
                    
                        this.idleStatus = { status: msg.status, since: msg.since }
                        sabaki.events.emit('idle-status', this.idleStatus)
                    } else {
                        throw('wait-error-halp')
                    }

                    // discard any other messages until we receive confirmation
                    // from BUGOUT that the move was made
                } catch (err) {
                    console.log(`Error processing idle status response: ${JSON.stringify(err)}`)
                    reject()
                }
            })
         })
    }

    pollBugoutOnline() {
        let command = {
            'type':'ProvideIdleStatus'
        }

        this.webSocket.send(JSON.stringify(command))

        this.idleStatusPoll = setInterval(() => {
            if (this.idleStatus && this.idleStatus.status && this.idleStatus.status !== IdleStatus.ONLINE) {
                let command = {
                    'type':'ProvideIdleStatus'
                }
        
                this.webSocket.send(JSON.stringify(command))
            }
        }, IDLE_STATUS_POLL_MS)
    }
}

class GatewayConn {
    constructor(webSocket, handleWaitForOpponent, handleYourColor) {
        this.webSocket = webSocket

        if (handleWaitForOpponent == undefined || handleYourColor == undefined) {
            throw Exception('malformed gateway conn')
        }

        // We manage handleWaitForOpponent at this level
        // so that the incoming websocket message triggers
        // a state update in App.js, even after an initial Wait event
        // has been handled by the WebsocketController
        this.handleWaitForOpponent = handleWaitForOpponent

        this.handleYourColor = handleYourColor

        sabaki.events.on('choose-color-pref', ({ colorPref }) =>    
            this.chooseColorPref(colorPref))
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
                        if (msg.type === 'Reconnected') {
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
                        this.handleWaitForOpponent({ gap: false, hasEvent: false })
                    } else if (msg.type === 'WaitForOpponent') {
                        resolve(msg)
                        this.handleWaitForOpponent({ gap: false, hasEvent: true, event: msg})
                    }
                    // discard any other messages
                } catch (err) {
                    console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                    reject()
                }
            })

            // We want to show the modal while we wait for a response from gateway
            this.handleWaitForOpponent( { gap: true, hasEvent: false })
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
                        this.handleWaitForOpponent({ gap: false, hasEvent: true, event: msg})
                    } else if (msg.type === 'GameReady') {
                        // later ...
                        resolve(msg)
                        this.handleWaitForOpponent({ gap: false, hasEvent: false })
                    }
                    // discard any other messages
                } catch (err) {
                    console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                    reject()
                }
            })

            // We want to show the modal while we wait for a response from gateway
            this.handleWaitForOpponent( { gap: true, hasEvent: false })
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
                        this.handleWaitForOpponent({ gap: false, hasEvent: false })
                    } else if (msg.type === 'PrivateGameRejected') {
                        resolve(msg)
                    }
                    // discard any other messages
                } catch (err) {
                    console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                    reject()
                }
            })

            // We want to show the modal while we wait for a response from gateway
            this.handleWaitForOpponent( { gap: true, hasEvent: false })
            this.webSocket.send(JSON.stringify(requestPayload))
        })
    }

    async chooseColorPref(colorPref) {
        return new Promise((resolve, reject) => {
            let requestPayload = {
                'type':'ChooseColorPref',
                'colorPref': colorPref
            }

            // Let this listener stack
            this.webSocket.addEventListener('message', event => {
                try {
                    let msg = JSON.parse(event.data)
                    
                    if (msg.type === 'YourColor') {
                        resolve(msg)
                        this.handleYourColor({ wait: false, event: msg })
                    }
                    // discard any other messages
                } catch (err) {
                    console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                    reject()
                }
            })

            // We want to show a modal while we wait for a response from gateway
            this.handleYourColor( { wait: true } )
            this.webSocket.send(JSON.stringify(requestPayload))
        })
    }
}

exports.Controller = Controller
exports.Command = Command
exports.letterToPlayer = letterToPlayer
