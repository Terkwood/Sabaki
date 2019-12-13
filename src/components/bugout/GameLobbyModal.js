const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

const { EntryMethod, IdleStatus } = require('../../modules/bugout')

class GameLobbyModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: true }
    }

    render({ id = "game-lobby-modal", joinPrivateGame = false, idleStatus, update }) {
        let empty = h('div', { id })

        if (idleStatus && idleStatus !== IdleStatus.ONLINE) {
            return empty
        }

        if (joinPrivateGame && this.state.showDialog) {
            return h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, "Join Private Game"),
                h(Dialog.Body, null, "🐛 Welcome to BUGOUT! You're joining a private game created by your friend."),
                h(Dialog.Footer, null, 
                    h(Dialog.FooterButton, 
                        { 
                            accept: true, 
                            onClick: () => {
                                this.setState({showDialog: false})
                                update(EntryMethod.JOIN_PRIVATE)
                            }
                        }, 
                        "OK")
                    )
            )
        }

        return  (this.state.showDialog) ? h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, "Choose Venue"),
            h(Dialog.Body, null, "🐛 Welcome to BUGOUT! You may find a public game with the next available player, or create a private game and share its link with your friend."),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        accept: true, 
                        onClick: () => {
                            this.setState({showDialog: false})
                            update(EntryMethod.FIND_PUBLIC)
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
                            update(EntryMethod.CREATE_PRIVATE)
                        }
                    }, "Private"))
        ) : empty
    }
}

export default GameLobbyModal
