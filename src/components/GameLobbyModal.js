const {h, Component} = require('preact')

class GameLobbyModal extends Component {
    constructor() {
        super()
    }

    render({smarmyMessage}) {
        return h('div',
            {
                id: 'foobarbazqux'
            },

            smarmyMessage
        )
    }
}

module.exports = GameLobbyModal
