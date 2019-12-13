const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

class BugoutIdleStatusModal extends Component {
    constructor() {
        super()
    }

    render({ 
        id = 'bugout-idle-status-modal', 
        idleStatus
    }) {
        let empty = h('div', { id })

        if (undefined == idleStatus) {
            return empty
        }
        return reconnectDialog ?
            h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, 'System Idle' ),
                h(Dialog.Body, null, "BUGOUT is currently offline."),
            )
        : empty
    }
}