const { h, Component } = require('preact')

const { Dialog } = require('preact-material-components')

const { Visibility } = require('../modules/bugout')

class WaitForOpponentModal extends Component {
    constructor() {
        super()
    }

    render({ 
        id = "wait-for-opponent-modal", 
        waitForOpponentEvent
    }) {
        JSON.stringify(`waitoppo ${JSON.stringify(waitForOpponentEvent)}`)
        return undefined != waitForOpponentEvent ?
           h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, "Please Wait"),
                waitForOpponentEvent.visibility === Visibility.PUBLIC ?
                    h(Dialog.Body, null, "The game will start once both players are present") : 
                    h(Dialog.Body, null, `Join this private game: ${waitForOpponentEvent.link}`)
            )
        : h('div', { id })
    }
}

module.exports = WaitForOpponentModal
