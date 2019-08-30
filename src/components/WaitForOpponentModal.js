const { h, Component } = require('preact')

const { Dialog } = require('preact-material-components')

const { Visibility } = require('../modules/bugout')

class WaitForOpponentModal extends Component {
    constructor() {
        super()

        this.state = { copied: false }
        
        try {
            navigator.permissions.query({name: "clipboard-write"}).then(result => {
            if (result.state == "granted" || result.state == "prompt") {
              /* write to the clipboard now */
              console.log('OK for clipboard write')
            }
          });
        } catch (e) {
            console.log('No clipboard write permission')
        }
    }

    updateClipboard(newClip) {
        navigator.clipboard.writeText(newClip).then(() => {
          this.setState({copied: true})
        }, () => {
          throw Exception('clipboard write failed')
        });
      }

    render({ 
        id = 'wait-for-opponent-modal', 
        waitForOpponentEvent
    }) {
        JSON.stringify(`waitoppo ${JSON.stringify(waitForOpponentEvent)}`)

        // dfried says a thunk is a thunk
        let copyLinkFooter = () => h(Dialog.Footer, null, 
            h(Dialog.FooterButton, 
                { 
                    accept: true, 
                    onClick: () => {
                        console.log('update clipboard')
                        this.updateClipboard(waitForOpponentEvent.link)
                    }
                }, 
                this.state.copied ? 'Copied! ⭐︎' : 'Copy link 🔗')
            )

        let emptyFooter = () => h(Dialog.Footer, null)

        let isPublic = () => waitForOpponentEvent.visibility === Visibility.PUBLIC

        return undefined != waitForOpponentEvent ?
           h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, isPublic() ? 'Please Wait' : 'Share Private Link'),
                isPublic() ?
                    h(Dialog.Body, null, 'The game will start once both players are present') : 
                    h(Dialog.Body, null, `Click the button below to copy a link to this game onto your clipboard.  You may then paste it to a friend.`),
                isPublic() ? emptyFooter() : copyLinkFooter()
            )
        : h('div', { id })
    }
}

module.exports = WaitForOpponentModal
