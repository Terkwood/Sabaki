const EventEmitter = require('events')

class Controller extends EventEmitter {
    constructor(path, args = [], spawnOptions = {}) {
        super()

        this.path = path
        this.args = args
        this.spawnOptions = spawnOptions

        this._wsController = null // TODO
        this.websocket = null
        this.commands = []
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
                this.websocket.send(
                    JSON.stringify(
                        {
                            "type":"MakeMove",
                            "gameId":"6ff6253d-ddba-4221-b4ec-d658e860343d", // TODO
                            "reqId":"deadbeef-dead-beef-9999-beefbeefbeef", // TODO
                            "player":"BLACK",  // TODO
                            "coord": {"x":0,"y":0}
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