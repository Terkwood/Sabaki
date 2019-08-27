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

const ColorPref = {
    BLACK: 1,
    WHITE: 2,
    ANY: 3,
}

const BLACK = "B"
const WHITE = "W"

const Color = {
    BLACK,
    WHITE
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
        readyToEnter: state => {
            console.log(`state.multiplayer ${JSON.stringify(state.multiplayer)}`)
            if (state.multiplayer) {
                console.log(`\t initConnect\t${state.multiplayer.initConnect}`)
                console.log(`\t visibility\t${state.multiplayer.visibility}`)
                console.log(`\t or jp.join\t${jp.join}`)
                console.log(`\t colorPref\t${state.multiplayer.colorPref}`)
            }
            return state.multiplayer && (
                state.multiplayer.initConnect == undefined || 
                state.multiplayer.initConnect < InitConnected.IN_PROGRESS
            ) && (state.multiplayer.visibility || jp.join) && state.multiplayer.colorPref
        },
        prefToColor: colorPref => colorPref == ColorPref.BLACK ?  BLACK : WHITE,
    };
}

exports.load = load
exports.Visibility = Visibility
exports.InitConnected = InitConnected
exports.ColorPref = ColorPref
exports.Color = Color
