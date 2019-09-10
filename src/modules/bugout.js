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
const InitConnected = {
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

const load = () => {
    let engine = {"name":"Opponent", "path":"/bugout", "args": ""}
    let jp = joinPrivateGameParam()
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
        readyToEnter: state => state.multiplayer && (
                state.multiplayer.initConnect == undefined || 
                state.multiplayer.initConnect < InitConnected.IN_PROGRESS
            ) && (state.multiplayer.entryMethod || jp.join),
        playerToColor: player => player == Player.BLACK ?  BLACK : WHITE,
    };
}

exports.load = load
exports.Visibility = Visibility
exports.InitConnected = InitConnected
exports.ColorPref = ColorPref
exports.Color = Color
exports.EntryMethod = EntryMethod
exports.Player = Player
