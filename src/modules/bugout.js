const re = new RegExp(/^[a-zA-Z0-9]+$/, 'm')

const MIN_ID_LENGTH = 18
const MAX_ID_LENGTH = 37

const isValidGameId = p =>
    p && p.length > MIN_ID_LENGTH && p.length < MAX_ID_LENGTH && re.test(p)

const joinGameParam = () => {
    let urlParams = new URLSearchParams(window.location.search)
    console.log(`urllll `)
    if (urlParams.has("join") && isValidGameId(urlParams.get("join"))) {
        return { join: true, gameId: urlParams.get("join") }
    } else {
        console.log("FAIL")
        return { join: false }
    }
}

const BLACK = "B"
const WHITE = "W"
const playerColor = () => 
    window.confirm("Press Cancel for White, Press OK for Black") ? BLACK : WHITE

const load = () => {
    let pc = playerColor()
    let engine = {"name":"Opponent", "path":"/bugout", "args": ""}
    return {
        joinGame: joinGameParam(),
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
        }
    };
}

exports.load = load
