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
                    "Find public game")
                ),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            console.log("PRIVATE")
                            this.setState({showDialog: false})
                        }
                    }, "Create private game"))
        ) : h('div', { id })
    }
}

module.exports = GameLobbyModal
