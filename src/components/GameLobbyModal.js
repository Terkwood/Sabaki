const { h, Component } = require('preact')

const { Dialog } = require('preact-material-components')

const { Visibility } = require('../modules/bugout')

class GameLobbyModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: true }
    }

    render({ id = "game-lobby-modal" }) {
        
        return  (this.state.showDialog) ? h(Dialog,
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
                            this.setState({showDialog: false})
                            // CAUTION - GLOBAL STATE AHEAD
                            sabaki.setState({ multiplayer: { visibility: Visibility.PUBLIC } })
                        }
                    }, 
                    "Public")
                ),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false})
                            // CAUTION - GLOBAL STATE AHEAD
                            sabaki.setState({ multiplayer: { visibility: Visibility.PRIVATE } })
                        }
                    }, "Private"))
        ) : h('div', { id })
    }
}

module.exports = GameLobbyModal
