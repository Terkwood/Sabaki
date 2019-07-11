/// BUGOUT support for "gtp-like" multiplayer coordination

const EventEmitter = require('events')
const Board = require('../board')
const uuidv4 = require('uuid/v4')

const HARDCODED_GAME_ID = "62099e58-18e7-48a4-b0f3-f610363aca31"

const GATEWAY_HOST_LOCAL = "ws://localhost:3012/gateway"
const GATEWAY_HOST_REMOTE = "wss://your.host.here:443/gateway"
const GATEWAY_HOST = GATEWAY_HOST_REMOTE

class Controller extends EventEmitter {
    constructor(path, args = [], spawnOptions = {}) {
        super()

        this.path = path
        this.args = args
        this.spawnOptions = spawnOptions

        this._webSocketController = null
        
        console.log(`GAME ${HARDCODED_GAME_ID}`)
    }

    get busy() {
        return this._webSocketController != null && this._webSocketController.busy
    }

    start() {
        if (this._webSocketController != null) return
        
        this._webSocketController = new WebSocketController(GATEWAY_HOST)
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

const letterToPlayer = letter =>  letter == "B" ? "BLACK" : "WHITE"

class WebSocketController extends EventEmitter {
    constructor(webSocketAddress) {
        super()

        // TODO BUGOUT don't hardcode this
        this.board = new Board(19,19)
        this.webSocketAddress = webSocketAddress
        this.webSocket = new WebSocket(webSocketAddress)

        // manually ping the websocket every once in a while
        this.beeping = true
        this.beepTimeMs = 12625
        setTimeout(() => this.beep(), this.beepTimeMs)

        this.webSocket.onclose = event => {
            console.log("websocket closed")
        }

        this.webSocket.onerror = event => {
            console.log(`websocket error ${JSON.stringify(event)}`)
        }
    }

    async sendCommand(command, subscriber = () => {}) {
        console.log(`GTP command ${JSON.stringify(command)}`)
        let promise = new Promise((resolve, reject) => {
            if (command.name == "play") {
                let player = letterToPlayer(command.args[0])
                let vertex = this.board.coord2vertex(command.args[1])

                let makeMove = {
                    "type":"MakeMove",
                    "gameId": HARDCODED_GAME_ID, // TODO
                    "reqId": uuidv4(),
                    "player":player,
                    "coord": {"x":vertex[0],"y":vertex[1]}
                }

                this.webSocket.onmessage = event => {
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
                }

                this.webSocket.send(JSON.stringify(makeMove))
            } else if (command.name === "genmove") {
                this.webSocket.onmessage = event => {
                    try {
                        let msg = JSON.parse(event.data)
                        if (msg.type === "MoveMade" && msg.player === letterToPlayer(command.args[0])) {
                            let sabakiCoord = this.board.vertex2coord([msg.coord.x, msg.coord.y])
                            resolve({"id":null,"content":sabakiCoord,"error":false})
                        }
        
                        // discard any other messages until we receive confirmation
                        // from BUGOUT that the move was made
                    } catch (err) {
                        console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                        resolve({"id": null, "content": "", "error": true})
                    }
                }

             } else {
                 resolve(true)
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
            setTimeout(() => this.beep(), this.beepTimeMs)
        }
    }

    stop() {
        this.webSocket.close()
        this.beeping = false
    }
}

exports.Controller = Controller
exports.Command = Command
exports.letterToPlayer = letterToPlayer
