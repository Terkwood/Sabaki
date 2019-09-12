const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

const { ConnectionState } = require('../../modules/bugout')

const DisconnectedBody = h(Dialog.Body, null, 'Please wait while we reestablish internet communication.')
const InProgressBody = h(Dialog.Body, null, 'Connecting...')
const ConnectedBody = h(Dialog.Body, null, 'Connected!')
const FailedBody = h(Dialog.Body, null, 'FATAL ERROR ⚰️')

const chooseBody = connectionState => {
    if (connectionState == ConnectionState.DISCONNECTED) {
        return DisconnectedBody
    } else if (connectionState == ConnectionState.IN_PROGRESS) {
        return InProgressBody
    } else if (connectionState == ConnectionState.CONNECTED) {
        return ConnectedBody
    } else {
        return FailedBody
    }
}

const DEBOUNCE_MS = 1666

class ReconnectModal extends Component {
    constructor() {
        super()
        this.setState({ lastActivated: 0 })
    }

    render({ 
        id = 'reconnect-modal', 
        data
    }) {
        let empty = h('div', { id })

        if (undefined == data) {
            return empty
        }

        let { reconnectDialog, connectionState } = data

        //let now = new Date().getTime()

        if (undefined == reconnectDialog || undefined == connectionState /*|| now - DEBOUNCE_MILLIS < this.state.lastActivated*/) {
            return empty
        }

        /*if (reconnectDialog) {
            this.setState( { lastActivated: now })
        }*/

        return reconnectDialog ?
           h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, 'Network Unavailable' ),
                chooseBody(connectionState)
            )
        : empty
    }
}

export default ReconnectModal
