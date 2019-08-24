const {h, Component} = require('preact')

const { Button , Dialog} = require('preact-material-components')



class GameLobbyModal extends Component {
    constructor() {
        super()
        
    }

    componentDidMount() {
        this.dialog = new Dialog(document.querySelector('.mdc-dialog'))
    }

    componentWillUnmount() {
        this.dialog = undefined
    }

    render({}) {
        return h(Dialog,
            {
                id: "foobarbazqux"
            }
        )
    }
}

module.exports = GameLobbyModal
