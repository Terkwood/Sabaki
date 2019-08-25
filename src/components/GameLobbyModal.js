const { h, Component } = require('preact')

const { Dialog } = require('preact-material-components')

class GameLobbyModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: true }
    }

    render({ id = "game-lobby-modal" }) {
        
        return  this.state.showDialog ? h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, "Choose Venue"),
            h(Dialog.Body, null, "You may find a public game with the next available player, or create a private game and share its link with your friend."),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        accept: true, 
                        onClick: () => {
                            console.log("PUBLIC")
                            this.setState({showDialog: false})
                        }
                    }, 
                    "Public")
                ),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            console.log("PRIVATE")
                            this.setState({showDialog: false})
                        }
                    }, "Private"))
        ) : h('div', { id })
    }
}

module.exports = GameLobbyModal
