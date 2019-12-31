const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

const { BoardSize } = require('../../modules/multiplayer/bugout')

class BoardSizeModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: false, turnedOnOnce: false }
    }

    render({ id = 'board-size-modal', data, appEvents }) {
       
        if (undefined == data) {
            return h('div', { id })
        }

        let { colorPref } = data

        let { showDialog, turnedOnOnce } = this.state

        let turnOn = colorPref !== undefined

        let hide = !((turnOn && !turnedOnOnce) || showDialog)

        if (hide) {
            return h('div', { id })
        }

        return h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, 'Board Size'),
            h(Dialog.Body, null, 'Choose the dimensions of the board.'),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        accept: true, 
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            let boardSize = BoardSize.NINE
                            appEvents.emit('choose-board-size', { boardSize })
                        }
                    }, 
                    '9x9')
                ),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            let boardSize = BoardSize.THIRTEEN
                            appEvents.emit('choose-board-size', { boardSize })
                        }
                    }, '13x13')),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            let boardSize = BoardSize.NINETEEN
                            appEvents.emit('choose-board-size', { boardSize })
                        }
                    }, '19x19'))
        )
    }
}


export default BoardSizeModal
