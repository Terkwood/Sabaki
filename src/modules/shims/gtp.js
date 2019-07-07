const EventEmitter = require('events')
const Board = require('../board')

class Controller extends EventEmitter {
    constructor(path, args = [], spawnOptions = {}) {
        super()

        this.path = path
        this.args = args
        this.spawnOptions = spawnOptions

        this._wsController = null // TODO
        this.websocket = null
        this.commands = []

        this.board = new Board(19,19)
    }

    get busy() {
        return this._wsController != null && this._wsController.busy
    }

    start() {
        if (this.websocket != null) return
        
        this.websocket = new WebSocket("ws://localhost:3012/")
        
        this.websocket.onmessage = event => {
            console.log("Websocket message") // TODO BUGOUT
            console.log(JSON.stringify(event))
        }

        console.log("CONTROLLER START")  // TODO BUGOUT
    }


    async stop(timeout = 3000) {
        if (this.websocket == null) return

        return new Promise(() => console.log("CONTROLLER STOP"))  // TODO BUGOUT
    }

    kill() {
        if (this.websocket == null) return

        this.websocket.close()  // TODO BUGOUT VERIFY THIS IS ENOUGH
    }

    async sendCommand(command, subscriber = () => {}) {
        if (this.websocket == null) this.start()

        console.log(`send command ${JSON.stringify(command)}`)
        let promise = new Promise((resolve, reject) => {
            if (command.name == "play") {
                console.log("!!! -- PLAY -- !!!") // TODO

                let player = command.args[0] == "B" ? "BLACK" : "WHITE"
                let vertex = this.board.coord2vertex(command.args[1])
                console.log(`vertex ${JSON.stringify(vertex)}`)
                this.websocket.send(
                    JSON.stringify(
                        {
                            "type":"MakeMove",
                            "gameId":"9c9d51c0-d68a-4691-8cb3-9eeb0d1be3a5", // TODO
                            "reqId":"deadbeef-dead-beef-9999-beefbeefbeef", // TODO
                            "player":player,
                            "coord": {"x":vertex[0],"y":vertex[1]}
                        })
                    )
                resolve({}) // TODO
            }

            resolve({}) // TODO
        })

        return await promise
    }
}

exports.Controller = Controller