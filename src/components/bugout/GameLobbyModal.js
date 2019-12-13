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

        console.log(`lobby idleStatus ${idleStatus}`)

        if (idleStatus && idleStatus !== IdleStatus.ONLINE) {
            console.log('GL modal: system not online')
            return empty
        }

        console.log('GL modal: ALL SYSTEMS GO')

        if (joinPrivateGame && this.state.showDialog) {
            return h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, "Join Private Game"),
                h(Dialog.Body, null, "You're joining a private game created by your friend."),
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
            h(Dialog.Body, null, "You may find a public game with the next available player, or create a private game and share its link with your friend."),
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
