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
        console.log('constructed 1')
        this.board = new Board(19,19)
    }

    get busy() {
        return this._webSocketController != null && this._webSocketController.busy
    }

    start() {
        if (this.webSocket != null) return
        
        this.webSocket = new WebSocket("ws://localhost:3012/")
        console.log('make a websocket controller')
        this._webSocketController = new WebSocketController(this.webSocket)
        console.log('ok')
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

    // TODO it's sending the same commands over and over and over again
    // TODO it's sending the same commands over and over and over again
    // TODO it's sending the same commands over and over and over again
    async sendCommand(command, subscriber = () => {}) {
        if (this.webSocket == null) this.start()

        return await this._webSocketController.sendCommand(command, subscriber)
    }
}

class WebSocketController extends EventEmitter {
    constructor(webSocket) {
        super()

        this.webSocket = webSocket

        this.webSocket.onmessage = event => {
            console.log("Websocket message") // TODO BUGOUT
            console.log(JSON.stringify(event))
        }
    }

    async sendCommand(command, subscriber = () => {}) {
        console.log(`send command ${JSON.stringify(command)}`)
        let promise = new Promise((resolve, reject) => {
            if (command.name == "play") {
                let player = command.args[0] == "B" ? "BLACK" : "WHITE"
                let vertex = this.board.coord2vertex(command.args[1])
                
                // TODO it's sending the same commands over and over and over again
                // TODO it's sending the same commands over and over and over again
                // TODO it's sending the same commands over and over and over again
                this.webSocket.send(
                    JSON.stringify(
                        {
                            "type":"MakeMove",
                            "gameId":"f154c2de-def7-4325-8ece-2fbfd342ceaf", // TODO
                            "reqId":"deadbeef-dead-beef-9999-beefbeefbeef", // TODO
                            "player":player,
                            "coord": {"x":vertex[0],"y":vertex[1]}
                        })
                    )
                resolve({}) // TODO
            }

            resolve({}) // TODO
            // TODO it's sending the same commands over and over and over again
            // TODO it's sending the same commands over and over and over again
            // TODO it's sending the same commands over and over and over again
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

exports.Command = { 
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