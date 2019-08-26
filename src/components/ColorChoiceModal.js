const { h, Component } = require('preact')

const { Dialog } = require('preact-material-components')


class ColorChoiceModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: false, turnedOnOnce: false }
    }

    render({ id = "color-choice-modal", turnOn = false }) {
        let { showDialog, turnedOnOnce } = this.state
      
        return ((turnOn && !turnedOnOnce) || showDialog) ? h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, "Choose Your Color"),
            h(Dialog.Body, null, "Choose please"),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        accept: true, 
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            // 🚧 Not Implemented 🚧
                        }
                    }, 
                    "Black")
                ),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            // 🚧 Not Implemented 🚧
                        }
                    }, "White")),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            // 🚧 Not Implemented 🚧
                        }
                    }, "Any"))
        ) : h('div', { id })
    }
}

module.exports = ColorChoiceModal
