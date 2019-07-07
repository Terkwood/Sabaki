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

        console.log("BEEP")  // TODO BUGOUT
    }
}

exports.Controller = Controller