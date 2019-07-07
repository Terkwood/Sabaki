const EventEmitter = require('events')

class Controller extends EventEmitter {
    constructor(path, args = [], spawnOptions = {}) {
        super()

        this.path = path
        this.args = args
        this.spawnOptions = spawnOptions

        this._streamController = null
        this.process = null
        this.commands = []
    }

    get busy() {
        return this._streamController != null && this._streamController.busy
    }

    start() {
        if (this.process != null) return

        console.log("CONTROLLER START")  // TODO BUGOUT
    }


    async stop(timeout = 3000) {
        if (this.process == null) return

        return new Promise(() => console.log("CONTROLLER STOP"))  // TODO BUGOUT
    }

    kill() {
        if (this.process == null) return

        console.log("CONTROLLER KILL") // TODO BUGOUT
    }

    async sendCommand(command, subscriber = () => {}) {
        if (this.process == null) this.start()

        return await new Promise(() => console.log("CONTROLLER SEND COMMAND")) // TODO BUGOUT
    }
}

exports.Controller = Controller