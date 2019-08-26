/**
 * Enum representing game visibility
 */
const Visibility = {
    PUBLIC: 1,
    PRIVATE: 2,
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

const BLACK = "B"
const WHITE = "W"

/** private to isValidGameId */
const MIN_ID_LENGTH = 18
/** private to isValidGameId */
const MAX_ID_LENGTH = 37
/** private to isValidGameId */
const re = new RegExp(/^[a-zA-Z0-9]+$/, 'm')

const isValidGameId = p =>
    p && p.length > MIN_ID_LENGTH && p.length < MAX_ID_LENGTH && re.test(p)

const joinPrivateGameParam = () => {
    let urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.has("join") && isValidGameId(urlParams.get("join"))) {
        return { join: true, gameId: urlParams.get("join") }
    } else {
        return { join: false }
    }
}

const playerColor = () => 
    window.confirm("Press Cancel for White, Press OK for Black") ? BLACK : WHITE

const load = () => {
    let pc = playerColor()
    let engine = {"name":"Opponent", "path":"/bugout", "args": ""}
    let jp = joinPrivateGameParam()
    return {
        joinPrivateGame: jp,
        playerColor: pc,
        start: (cb) => {
            const STARTUP_WAIT_MS = 1333
            if (pc === WHITE) {
                setTimeout(
                    cb,
                    STARTUP_WAIT_MS)
            }
        },
        engine,
        attach: appAttachEngines => {
            if (pc === WHITE) {
                appAttachEngines(engine, null)
            } else {
                appAttachEngines(null,engine)
            }
        },
        readyToEnter: state => {
            return state.multiplayer && (
                state.multiplayer.initConnect == undefined || 
                state.multiplayer.initConnect < InitConnected.IN_PROGRESS
                ) && (state.multiplayer.visibility || jp.join)
        }
    };
}

exports.load = load
exports.Visibility = Visibility
exports.InitConnected = InitConnected
