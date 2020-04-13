const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

const { ColorPref, EntryMethod, IdleStatus } = require('../../modules/multiplayer/bugout')

class HumanColorPrefModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: false, turnedOnOnce: false }
    }

    render({ id = "human-color-pref-modal", data, idleStatus, chooseColorPref }) {
       
        if (data == undefined) {
            return h('div', { id })
        }

        let { entryMethod, boardSize } = data

        let turnOn = entryMethod && entryMethod == EntryMethod.CREATE_PRIVATE ? boardSize !== undefined : true

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
            h(Dialog.Header, null, 'Turn Order'),
            h(Dialog.Body, null, 'Choose your color preference. We may assign them at random.'),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        accept: true, 
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            chooseColorPref( ColorPref.BLACK )
                        }
                    }, 
                    "Black")
                ),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            chooseColorPref( ColorPref.WHITE )
                        }
                    }, "White")),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        cancel: true,
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            chooseColorPref( ColorPref.ANY )
                        }
                    }, "Either"))
        )
    }
}


export default HumanColorPrefModal
