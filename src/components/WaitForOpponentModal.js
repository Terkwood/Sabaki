const { h, Component } = require('preact')

const { Dialog } = require('preact-material-components')

const { Visibility } = require('../modules/bugout')

function updateClipboard(newClip) {
    navigator.clipboard.writeText(newClip).then(() => {
      /* clipboard successfully set */
    }, () => {
      throw Exception('clipboard write failed')
    });
  }

class WaitForOpponentModal extends Component {
    constructor() {
        super()

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

    render({ 
        id = 'wait-for-opponent-modal', 
        waitForOpponentEvent
    }) {
        JSON.stringify(`waitoppo ${JSON.stringify(waitForOpponentEvent)}`)

        let copyLinkFooter = () => h(Dialog.Footer, null, 
            h(Dialog.FooterButton, 
                { 
                    accept: true, 
                    onClick: () => {
                        console.log('update clipboard')
                        updateClipboard(waitForOpponentEvent.link)
                    }
                }, 
                'Copy link 🔗')
            )

        let emptyFooter = () => h(Dialog.Footer, null)

        let isPublic = () => waitForOpponentEvent.visibility === Visibility.PUBLIC

        return undefined != waitForOpponentEvent ?
           h(Dialog,
                {
                    id,
                    isOpen: true,
                },
                h(Dialog.Header, null, 'Please Wait'),
                isPublic() ?
                    h(Dialog.Body, null, 'The game will start once both players are present') : 
                    h(Dialog.Body, null, `Click the button below to copy a link to this game onto your clipboard.  You may then paste it to a friend.`),
                isPublic() ? emptyFooter() : copyLinkFooter()
            )
        : h('div', { id })
    }
}

module.exports = WaitForOpponentModal
