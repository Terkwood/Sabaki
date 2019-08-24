const {h, Component} = require('preact')

const { Dialog} = require('preact-material-components')



class GameLobbyModal extends Component {
    constructor() {
        super()
        
    }


    render({}) {
        return h(Dialog,
            {
                id: "foobarbazqux",
                isOpen: true,
                visibility: 'visible' // dialog surface
            },
            h(Dialog.Body, null, "You may find a public game with the next available player, or create a private game and share its link with your friend."),
            h(Dialog.Footer, null, h(Dialog.FooterButton, { accept: true }, "Find public game")),
            h(Dialog.Footer, null, h(Dialog.FooterButton, { cancel: true }, "Create private game"))
        )
    }
}

module.exports = GameLobbyModal
