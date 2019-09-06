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

        return undefined != data && data.wait ?
           h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, 'Please Wait' ),
                h(Dialog.Body, null, 'WAITING FOR YOUR COLOR')
            )
        : h('div', { id })
    }
}

export default WaitForYourColorModal
