const { h, Component } = require('preact')

const { Dialog } = require('preact-material-components')


class ColorChoiceModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: false }
    }

    render({ id = "color-choice-modal", showDialog = false }) {
        // TODO this trash :-D
        let { stateShowDialog: showDialog } = this.state
        if (stateShowDialog != showDialog) {
            this.setState({showDialog})
        }

        return showDialog ? h(Dialog,
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

module.exports = GameLobbyModal
