const EventEmitter = require('events')
const Board = require('../board')

class Controller extends EventEmitter {
    constructor(path, args = [], spawnOptions = {}) {
        super()

        this.path = path
        this.args = args
        this.spawnOptions = spawnOptions

        this.websocket = null
        this.commands = []

        this.board = new Board(19,19)
    }

    get busy() {
        return false // TODO
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

    // TODO it's sending the same commands over and over and over again
    // TODO it's sending the same commands over and over and over again
    // TODO it's sending the same commands over and over and over again
    async sendCommand(command, subscriber = () => {}) {
        if (this.websocket == null) this.start()

        console.log(`send command ${JSON.stringify(command)}`)
        let promise = new Promise((resolve, reject) => {
            if (command.name == "play") {
                let player = command.args[0] == "B" ? "BLACK" : "WHITE"
                let vertex = this.board.coord2vertex(command.args[1])
                
                // TODO it's sending the same commands over and over and over again
                // TODO it's sending the same commands over and over and over again
                // TODO it's sending the same commands over and over and over again
                this.websocket.send(
                    JSON.stringify(
                        {
                            "type":"MakeMove",
                            "gameId":"01014543-02db-4823-b06c-9742fdfcf667", // TODO
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

        return await promise
    }
}

exports.Controller = Controller