/// BUGOUT support for "gtp-like" multiplayer coordination

const EventEmitter = require('events')
const Board = require('../board')
const uuidv4 = require('uuid/v4')

// TODO
const HARDCODED_GAME_ID = "d4d13093-4633-4aee-ae49-684d14688254"

class Controller extends EventEmitter {
    constructor(path, args = [], spawnOptions = {}) {
        super()

        this.path = path
        this.args = args
        this.spawnOptions = spawnOptions

        this._webSocketController = null
        this.webSocket = null
        this.commands = []
    }

    get busy() {
        return this._webSocketController != null && this._webSocketController.busy
    }

    start() {
        if (this.webSocket != null) return
        
        this.webSocket = new WebSocket("ws://localhost:3012/")
        this._webSocketController = new WebSocketController(this.webSocket)
        this._webSocketController.on('command-sent', evt => this.emit('command-sent', evt))
        this._webSocketController.on('response-received', evt => this.emit('response-received', evt))

        this.emit('started')
    }


    async stop(timeout = 3000) {
        if (this.webSocket == null) return

        return new Promise(() => console.log("CONTROLLER STOP"))  // TODO BUGOUT
    }

    kill() {
        if (this.webSocket == null) return

        this.webSocket.close()
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
    constructor(webSocket) {
        super()

        // TODO BUGOUT don't hardcode this
        this.board = new Board(19,19)
        this.webSocket = webSocket
    }

    async sendCommand(command, subscriber = () => {}) {
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
                        resolve({ok: false})
                    }
                }

             } else {
                 console.log(`GTP command ${JSON.stringify(command)}`)
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
}

exports.Controller = Controller
exports.Command = Command
exports.letterToPlayer = letterToPlayer
