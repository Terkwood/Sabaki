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

        console.log("CONTROLLER START")  // TODO BUGOUT
    }


    async stop(timeout = 3000) {
        if (this.websocket == null) return

        return new Promise(() => console.log("CONTROLLER STOP"))  // TODO BUGOUT
    }

    kill() {
        if (this.websocket == null) return

        console.log("CONTROLLER KILL") // TODO BUGOUT
    }

    async sendCommand(command, subscriber = () => {}) {
        if (this.websocket == null) this.start()

        return await new Promise(() => console.log("CONTROLLER SEND COMMAND")) // TODO BUGOUT
    }
}

exports.Controller = Controller