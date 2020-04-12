const {h, Component} = require('preact')
const classNames = require('classnames')
const sgf = require('@sabaki/sgf')
const {BoundedGoban} = require('@sabaki/shudan')

const helper = require('../modules/helper')

class Goban extends Component {
    constructor(props) {
        super(props)

        this.handleVertexMouseUp = this.handleVertexMouseUp.bind(this)
        this.handleVertexMouseDown = this.handleVertexMouseDown.bind(this)
        this.handleVertexMouseMove = this.handleVertexMouseMove.bind(this)
    }

    componentDidMount() {
        document.addEventListener('mouseup', () => {
            this.mouseDown = false
        })

        // Resize board when window is resizing

        window.addEventListener('resize', () => {
            this.componentDidUpdate()
            this.setState({})
        })

        this.componentDidUpdate()
    }

    componentDidUpdate() {
        if (!this.element || !this.element.parentElement) return

        let {offsetWidth: maxWidth, offsetHeight: maxHeight} = this.element.parentElement

        if (maxWidth !== this.state.maxWidth || maxHeight !== this.state.maxHeight) {
            this.setState({maxWidth, maxHeight})
        }

        setTimeout(() => {
            let {offsetWidth: width, offsetHeight: height} = this.element

            let left = Math.round((maxWidth - width) / 2)
            let top = Math.round((maxHeight - height) / 2)

            if (left !== this.state.left || top !== this.state.top) {
                this.setState({left, top})
            }
        }, 0)
    }

    handleVertexMouseDown(evt, vertex) {
        this.mouseDown = true
        this.startVertex = vertex
    }

    handleVertexMouseUp(evt, vertex) {
        if (!this.mouseDown) return

        let {onVertexClick = helper.noop} = this.props

        this.mouseDown = false
        evt.vertex = vertex

        if (evt.x == null) evt.x = evt.clientX
        if (evt.y == null) evt.y = evt.clientY

        onVertexClick(evt)
        
        this.setState({clicked: true})
        setTimeout(() => this.setState({clicked: false}), 200)
    }

    handleVertexMouseMove(evt, vertex) {
        let {onVertexMouseMove = helper.noop} = this.props

        onVertexMouseMove(Object.assign(evt, {
            mouseDown: this.mouseDown,
            startVertex: this.startVertex,
            vertex
        }))
    }

    render({
        gameTree,
        treePosition,
        board,
        paintMap,
        dimmedStones = [],

        crosshair = false,
        showCoordinates = false,
        showMoveNumbers = false,
        fuzzyStonePlacement = true,
        animateStonePlacement = true,

        drawLineMode = null
    }, {
        top = 0,
        left = 0,
        maxWidth = 100,
        maxHeight = 100,
        clicked = false,
        temporaryLine = null
    }) {
        let signMap = board.arrangement
        let markerMap = board.markers

        // Calculate lines

        let lines = board.lines.filter(({v1, v2, type}) => {
            if (
                drawTemporaryLine
                && (
                    helper.equals([v1, v2], [temporaryLine.v1, temporaryLine.v2])
                    || (type !== 'arrow' || drawLineMode === 'line')
                    && helper.equals([v2, v1], [temporaryLine.v1, temporaryLine.v2])
                )
            ) {
                drawTemporaryLine = false
                return false
            }

            return true
        })



        // Draw move numbers

        if (showMoveNumbers) {
            markerMap = markerMap.map(row => row.map(_ => null))

            let history = [...gameTree.listNodesVertically(treePosition, -1, {})].reverse()

            for (let i = 0; i < history.length; i++) {
                let node = history[i]
                let vertex = [-1, -1]

                if (node.data.B != null) vertex = sgf.parseVertex(node.data.B[0])
                else if (node.data.W != null) vertex = sgf.parseVertex(node.data.W[0])

                let [x, y] = vertex

                if (markerMap[y] != null && x < markerMap[y].length) {
                    markerMap[y][x] = {type: 'label', label: i.toString()}
                }
            }
        }


        return h(BoundedGoban, {
            id: 'goban',
            class: classNames({crosshair}),
            style: {top, left},
            innerProps: {ref: el => this.element = el},

            maxWidth,
            maxHeight,
            showCoordinates,
            fuzzyStonePlacement,
            animateStonePlacement: clicked && animateStonePlacement,

            signMap,
            markerMap,
            lines,
            dimmedVertices: dimmedStones,

            onVertexMouseUp: this.handleVertexMouseUp,
            onVertexMouseDown: this.handleVertexMouseDown,
            onVertexMouseMove: this.handleVertexMouseMove
        })
    }
}

module.exports = Goban
