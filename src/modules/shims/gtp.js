const EventEmitter = require('events')

class Controller extends EventEmitter {
    constructor(path, args = [], spawnOptions = {}) {
        super()

        this.path = path
        this.args = args
        this.spawnOptions = spawnOptions

        this._wsController = null
        this.websocket = null
        this.commands = []
    }

    get busy() {
        return this._wsController != null && this._wsController.busy
    }

    start() {
        if (this.websocket != null) return
        
        this.websocket = new WebSocket("ws://127.0.0.1:3012/")
        console.log("CONNECTION NEEDS TO HAPPEN")
        this.websocket.onmessage = event => {
            console.log("Websocket message")
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

        this.websocket.close()
    }

    async sendCommand(command, subscriber = () => {}) {
        if (this.websocket == null) this.start()

        return await new Promise(() => console.log("CONTROLLER SEND COMMAND")) // TODO BUGOUT
    }
}

exports.Controller = Controller