const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

class WelcomeModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: true }
    }

    render({ id = "welcome-modal" }) {
        return this.state.showDialog ?
            h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, "Welcome"),
                h(Dialog.Body, null, "Welcome to BUGOUT! Would you like to play a game of Go?"),
                h(Dialog.Footer, null, 
                    h(Dialog.FooterButton, 
                        { 
                            accept: true, 
                            onClick: () => {
                                this.setState({showDialog: false})
                            }
                        }, 
                        "Let's Play! 🐛")
                    )
            ): h('div', { id })
    }
}

export default WelcomeModal
