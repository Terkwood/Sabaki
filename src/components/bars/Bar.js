const {h, Component} = require('preact')
const classNames = require('classnames')

class Bar extends Component {
    constructor(props) {
        super(props)

        this.state = {
            hidecontent: props.type !== props.mode,
            gameOver: false
        }

        // From GTP.js
        sabaki.events.on('bugout-opponent-quit', this.onGameOver)
        sabaki.events.on('resign', this.onGameOver)

        this.componentWillReceiveProps(props)
        this.onCloseButtonClick = () => sabaki.setMode('play')
    }

    onGameOver() {
        console.log("Bar got quit")
        this.setState({ gameOver: true })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.type === nextProps.mode) {
            clearTimeout(this.hidecontentId)

            if (this.state.hidecontent)
                this.setState({hidecontent: false})
        } else {
            if (!this.state.hidecontent)
                this.hidecontentId = setTimeout(() => this.setState({hidecontent: true}), 500)
        }
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.mode !== this.props.mode || nextProps.mode === nextProps.type
    }

    render({children, type, mode, class: c = ''}, {hidecontent}) {
        return h('section',
            {
                id: type,
                class: classNames(c, {
                    bar: true,
                    current: type === mode,
                    hidecontent
                })
            },

            children,
            this.state.gameOver ? h('div') : h('a', { class: 'close', href: '#', onClick: this.onCloseButtonClick })
        )
    }
}

module.exports = Bar
