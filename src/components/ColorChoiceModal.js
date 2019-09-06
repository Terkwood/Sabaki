const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

const { ColorPref } = require('../modules/bugout')

class ColorChoiceModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: false, turnedOnOnce: false }
    }

    render({ id = "color-choice-modal", turnOn = false, updateYourColor }) {
        let { showDialog, turnedOnOnce } = this.state
      
        return ((turnOn && !turnedOnOnce) || showDialog) ? h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, 'Choose a Color'),
            h(Dialog.Body, null, "We're on the honor system, for now.  If you choose the same color as your opponent, we apologize."),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        accept: true, 
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                            updateYourColor( ColorPref.BLACK )
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
                            updateYourColor( ColorPref.WHITE )
                        }
                    }, "White"))
        ) : h('div', { id })
    }
}


export default ColorChoiceModal
