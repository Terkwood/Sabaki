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
                h(Dialog.Header, null, 'Please Wait' ),
                h(Dialog.Body, null, "BUGOUT is initializing."),
            )
        }

        return h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, 'System Offline' ),
            h(Dialog.Body, null, `BUGOUT has been idle since ${idleStatus.since}.`),
        )
    }
}

export default IdleStatusModal
