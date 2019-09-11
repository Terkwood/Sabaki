/**
 * Enum representing game visibility
 */
const Visibility = {
    PUBLIC: 'Public',
    PRIVATE: 'Private',
}

/**
 * Enum representing the status of an initial connection
 * attempt from Sabaki client to Bugout gateway
 */
const ConnectionState = {
    DISCONNECTED: 0,
    IN_PROGRESS: 1,
    CONNECTED: 2,
    FAILED: 3,
}

const ColorPref = {
    BLACK: 'Black',
    WHITE: 'White',
    ANY: 'Any',
}

const EntryMethod = {
    FIND_PUBLIC: 1,
    CREATE_PRIVATE: 2,
    JOIN_PRIVATE: 3,
}

const BLACK = "B"
const WHITE = "W"

const Color = {
    BLACK,
    WHITE
}

/** Gateway uses this rep */
const Player = {
    BLACK: "BLACK",
    WHITE: "WHITE"
}

/** private to isValidGameId */
const MIN_ID_LENGTH = 4
/** private to isValidGameId */
const MAX_ID_LENGTH = 30
/** private to isValidGameId */
const re = new RegExp(/^[a-zA-Z0-9]+$/, 'm')

const isValidGameId = p =>
    p && p.length >= MIN_ID_LENGTH && p.length <= MAX_ID_LENGTH && re.test(p)

const joinPrivateGameParam = () => {
    let urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.has("join") && isValidGameId(urlParams.get("join"))) {
        return { join: true, gameId: urlParams.get("join") }
    } else {
        return { join: false }
    }
}

const registerReconnectEvents = app => {
    app.events.on('websocket-closed', () => app.setState({
        multiplayer: {
            ...app.state.multiplayer,
            connectionState: ConnectionState.DISCONNECTED,
            reconnectDialog: true,
        }
    }))

    app.events.on('websocket-connecting', () => app.setState({
        multiplayer: {
            ...app.state.multiplayer,
            connectionState: ConnectionState.IN_PROGRESS,
            reconnectDialog: true, // we've already connected once 
        }
    }))

    app.events.on('websocket-error', () => app.setState({
        multiplayer: {
            ...app.state.multiplayer,
            connectionState: ConnectionState.FAILED,
            reconnectDialog: true,
        }
    }))

    // The name differs since we're interested in a logical
    // reconnect, not simply a connection to the websocket.
    // We know that we have a valid game ID in hand.
    app.events.on('bugout-reconnected', ({ playerUp }) => {
        app.setState({
            multiplayer: {
                ...app.state.multiplayer,
                connectionState: ConnectionState.CONNECTED,
                playerUp
            }
        })

        let dialogDurationMs = 1000
    
        setTimeout(() => app.setState({
            multiplayer: {
                ...app.state.multiplayer,
                reconnectDialog: false,
                playerUp: undefined
            }
        }), dialogDurationMs)
    })
}

const placeholderColor = Player.BLACK

const load = () => {
    let engine = {"name":"Opponent", "path":"/bugout", "args": ""}
    let jp = joinPrivateGameParam()
    let readyToEnter = state => state.multiplayer && (
        state.multiplayer.connectionState == undefined || 
        (state.multiplayer.connectionState < ConnectionState.IN_PROGRESS & !state.multiplayer.reconnectDialog)
    ) && (state.multiplayer.entryMethod || jp.join)
    return {
        joinPrivateGame: jp,
        engine,
        attach: (appAttachEngines, playerColor) => {
            if (playerColor === WHITE) {
                appAttachEngines(engine, null)
            } else {
                appAttachEngines(null,engine)
            }
        },
        playerToColor: player => player == Player.BLACK ?  BLACK : WHITE,
        enterGame: (app, state) => {
            if (readyToEnter(state)) {
                app.setState({
                    multiplayer: {
                        ...app.state.multiplayer,
                        connectionState: ConnectionState.IN_PROGRESS
                    }
                })
                
                app.detachEngines()
                app.clearConsole()

                app.bugout.attach((a, b) => {
                    app.attachEngines(a, b)

                    if (app.state.attachedEngines === [null, null]) {
                        app.setState({
                            multiplayer: {
                                ...app.state.multiplayer,
                                connectionState: ConnectionState.FAILED
                            }
                        })
                        throw Exception('multiplayer connect failed')
                    } else {
                        app.setState({
                            multiplayer: {
                                ...app.state.multiplayer,
                                connectionState: ConnectionState.CONNECTED,
                                reconnectDialog: false, // We just now connected for the first time
                            }
                        })

                        app.events.once('your-color', ({ yourColor }) => {
                            if (yourColor === Player.WHITE) {
                                app.generateMove({ firstMove: true })
                            }
                        })

                        registerReconnectEvents(app)
                    }
                }, placeholderColor)
            }

        }
    };
}

exports.load = load
exports.Visibility = Visibility
exports.ConnectionState = ConnectionState
exports.ColorPref = ColorPref
exports.Color = Color
exports.EntryMethod = EntryMethod
exports.Player = Player
