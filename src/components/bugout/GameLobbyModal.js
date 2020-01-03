const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

const { BoardSize, EntryMethod, IdleStatus } = require('../../modules/multiplayer/bugout')

class GameLobbyModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: true }
    }

    render({ id = 'game-lobby-modal', joinPrivateGame = false, idleStatus, update, appEvents }) {
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
                h(Dialog.Header, null, "Join Game"),
                h(Dialog.Body, null, "🐛 Welcome to BUGOUT! You're joining a  game created by your friend."),
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
            h(Dialog.Body, null, "QUICK GAME: join the next available player, 19x19 board only. CREATE GAME: invite via URL, choose board size."),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        accept: true, 
                        onClick: () => {
                            this.setState({showDialog: false})
                            update(EntryMethod.FIND_PUBLIC)
                            let boardSize = BoardSize.NINETEEN
                            appEvents.emit('choose-board-size', boardSize)
                        }
                    }, 
                    "Quick Game")
                ),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false})
                            update(EntryMethod.CREATE_PRIVATE)
                        }
                    }, "Create Game"))
        ) : empty
    }
}

export default GameLobbyModal
