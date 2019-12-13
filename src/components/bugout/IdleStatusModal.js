const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

const { IdleStatus } = require('../../modules/bugout')

class IdleStatusModal extends Component {
    constructor() {
        super()
    }

    render({ 
        id = 'idle-status-modal', 
        data
    }) {
        console.log(`idle status modal data: ${JSON.stringify(data)}`)
        let empty = h('div', { id })

        if (undefined == data) {
            return empty
        }

        let { idleStatus } = data

        if (undefined == idleStatus || undefined == idleStatus.status || idleStatus.status === IdleStatus.ONLINE ) {
            return empty
        }

        if (idleStatus.status === IdleStatus.BOOTING) {
            return h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, 'System Initializing' ),
                h(Dialog.Body, null, "Please wait while BUGOUT boots up."),
            )
        }

        return h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, 'System Idle' ),
            h(Dialog.Body, null, "BUGOUT is currently offline."),
        )
    }
}

export default IdleStatusModal
