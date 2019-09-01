const { h, Component } = require('preact')

const { Dialog } = require('preact-material-components')

const { Visibility } = require('../modules/bugout')

class WaitForOpponentModal extends Component {
    constructor() {
        super()
        this.state = { copied: false }
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
        data
    }) {
        console.log(`wfpm data ${JSON.stringify(data)}`)
        // dfried says a thunk is a thunk is a thunk
        let copyLinkFooter = () => h(Dialog.Footer, null, 
            h(Dialog.FooterButton, 
                { 
                    accept: true, 
                    onClick: () => 
                        this.updateClipboard(data.event.link),
                }, 
                this.state.copied ? 'Copied! ⭐︎' : 'Copy link 🔗')
            )

        let emptyFooter = () => h(Dialog.Footer, null)

        let isPublic = () => data.gap || (data.hasEvent && data.event.visibility === Visibility.PUBLIC)

        return undefined != data && (data.gap || data.hasEvent) ?
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
