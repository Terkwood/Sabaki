const { h, Component } = require('preact')

// 🦹🏻‍ Bundle Bloat Protector
import Dialog from 'preact-material-components/Dialog'

class WaitForBotModal extends Component {
    constructor() {
        super()
        this.state = { isBotAttached: false, isBotPlaying: false }

        // From GTP.js
        sabaki.events.on('bugout-wait-for-bot',
            ({ isBotAttached, isBotPlaying }) => {
                this.setState({ isBotAttached, isBotPlaying })    
            }
        )
    }

    render({ id = 'wait-for-bot-modal' }) {
        let empty = h('div', { id })

        let message = this.state.isBotPlaying ? 
            'The bot is playing' :
            'The bot will join'
        
        let showDialog = !this.state.isBotAttached || this.state.isBotPlaying
        
        return showDialog ? h(Dialog,
            {
                id,
                isOpen: true,
            },
            h(Dialog.Header, null, 'Please Wait'),
            h(Dialog.Body, null, message),
            h(Dialog.Footer, null),
        ) : empty
    }
}

export default WaitForBotModal
