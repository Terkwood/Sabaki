const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

const { ColorPref } = require('../modules/bugout')

class ColorChoiceModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: false, turnedOnOnce: false }
    }

    render({ id = "color-choice-modal", turnOn = false, chooseColorPref }) {
        let { showDialog, turnedOnOnce } = this.state
      
        return ((turnOn && !turnedOnOnce) || showDialog) ? h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, 'Choose Color Preference'),
            h(Dialog.Body, null, 'In the case that both players want the same color, we shall assign them at random.'),
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
        ) : h('div', { id })
    }
}


export default ColorChoiceModal
