const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

const { BoardSize, IdleStatus } = require('../../modules/multiplayer/bugout')

class BoardSizeModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: false, turnedOnOnce: false }
    }

    render({ id = 'board-size-modal', turnOn = false, idleStatus, chooseBoardSize }) {
       
        let { showDialog, turnedOnOnce } = this.state

        let happyTimes = (turnOn && !turnedOnOnce) || showDialog

        if (!happyTimes || idleStatus == undefined || idleStatus !== IdleStatus.ONLINE) {
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
                            chooseBoardSize( BoardSize.NINE )
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
                            chooseBoardSize( BoardSize.THIRTEEN )
                        }
                    }, '13x13')),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            chooseBoardSize( BoardSize.NINETEEN )
                        }
                    }, '19x19'))
        )
    }
}


export default BoardSizeModal
