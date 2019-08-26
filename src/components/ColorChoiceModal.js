const { h, Component } = require('preact')

const { Dialog } = require('preact-material-components')


class ColorChoiceModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: false }
    }

    render({ id = "color-choice-modal", forceDialog = false }) {
        // TODO this trash :-D
        let { showDialog } = this.state
        if (forceDialog != showDialog) {
            this.setState({showDialog: forceDialog})
        }

        return forceDialog ? h(Dialog,
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
                            this.setState({showDialog: false})
                            // TODO DON'T USE GLOBAL STATE
                            
                        }
                    }, 
                    "Black")
                ),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false})
                            // TODO DON'T USE GLOBAL STATE

                        }
                    }, "White")),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false})
                            // TODO DON'T USE GLOBAL STATE

                        }
                    }, "Any"))
        ) : h('div', { id })
    }
}

module.exports = ColorChoiceModal
