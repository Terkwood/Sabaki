const EventEmitter = require('events')
const Board = require('../board')

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

        // TODO BUGOUT
        //this.commands = this._streamController.commands

        this.emit('started')
        console.log('started')
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

class WebSocketController extends EventEmitter {
    constructor(webSocket) {
        super()

        // TODO BUGOUT don't hardcode this
        this.board = new Board(19,19)
        this.webSocket = webSocket
    }

    letterToPlayer(letter) { return letter == "B" ? "BLACK" : "WHITE" }

    async sendCommand(command, subscriber = () => {}) {
        console.log(`send command ${JSON.stringify(command)}`)
        let promise = new Promise((resolve, reject) => {
            if (command.name == "play") {
                let player = this.letterToPlayer(command.args[0])
                let vertex = this.board.coord2vertex(command.args[1])

                const HARDCODED_GAME_ID = "b8a78f4d-0706-4587-8a65-512768f2a984"
                const HARDCODED_REQ_ID = "deadbeef-dead-beef-9999-beefbeefbeef"
                let makeMove = {
                    "type":"MakeMove",
                    "gameId": HARDCODED_GAME_ID, // TODO
                    "reqId": HARDCODED_REQ_ID, // TODO
                    "player":player,
                    "coord": {"x":vertex[0],"y":vertex[1]}
                }


                this.webSocket.onmessage = event => {
                    try {
                        let msg = JSON.parse(event.data)
                        if (msg.type === "MoveMade" && msg.replyTo === makeMove.reqId) {
                            console.log("MATCH")
                            resolve({ok: true})
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
                // TODO handoff to the other player
                console.log("GENMOVE")
                this.webSocket.onmessage = event => {
                    console.log(`GENMOVE: websocket message ${event.data}`)
                    try {
                        let msg = JSON.parse(event.data)
                        if (msg.type === "MoveMade" && msg.player === this.letterToPlayer(command.args[0])) {
                            console.log('done')
                            resolve({ok: true})
                        }

                        // discard any other messages until we receive confirmation
                        // from BUGOUT that the move was made
                    } catch (err) {
                        console.log(`Error processing websocket message: ${JSON.stringify(err)}`)
                        resolve({ok: false})
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
}

exports.Controller = Controller

exports.Command = Command