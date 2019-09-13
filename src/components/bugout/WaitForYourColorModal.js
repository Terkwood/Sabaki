const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

class WaitForYourColorModal extends Component {
    constructor() {
        super()
    }

    render({ 
        id = 'wait-for-your-color-modal', 
        data
    }) {
        let empty = h('div', { id })

        if (undefined == data) {
            return empty
        }

        let { yourColor, waitForOpponentModal } = data

        if (undefined == yourColor || undefined == waitForOpponentModal) {
            return empty
        }

        return yourColor.wait && waitForOpponentModal.gap == false && waitForOpponentModal.hasEvent == false ?
           h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, 'Please Wait' ),
                h(Dialog.Body, null, '🚧 EXPERIMENTAL: FAIRLY DECIDING WHO PLAYS FIRST. If this step takes a very long time, please abandon this session entirely and try again in a new tab! 🚧')
            )
        : empty
    }
}

export default WaitForYourColorModal