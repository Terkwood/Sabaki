const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

class YourColorChosenModal extends Component {
    constructor() {
        super()
        this.state = { showDialog: false, turnedOnOnce: false }
    }

    render({ id = "color-choice-modal", yourColor }) {
        console.log(`modal ${JSON.stringify(yourColor)}`)
        let { showDialog, turnedOnOnce } = this.state
      
        let empty = h('div', { id })

        if (undefined == yourColor || yourColor.wait || undefined == yourColor.event.yourColor) {
            console.log('sad')
            return empty
        }

        console.log('happy')
        return !yourColor.wait && (!turnedOnOnce || showDialog) ? h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, 'Your Color'),
            h(Dialog.Body, null, `Please enjoy playing ${yourColor.event.yourColor}.`),
            h(Dialog.Footer, null, 
                h(Dialog.FooterButton, 
                    { 
                        accept: true, 
                        onClick: () => {
                            this.setState({showDialog: false, turnedOnOnce: true })
                        }
                    }, 
                    "OK")
                )
        ) : empty
    }
}


export default YourColorChosenModal
