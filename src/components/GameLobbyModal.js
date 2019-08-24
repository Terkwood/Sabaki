const {h, Component} = require('preact')
const { Dialog } = require('preact-material-components')

class GameLobbyModal extends Component {
    constructor() {
        super()
    }

    render({smarmyMessage}) {
        return h(Dialog,
            {
                id: 'foobarbazqux'
            },

            smarmyMessage
        )
    }
}

module.exports = GameLobbyModal
