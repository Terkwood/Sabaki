const re = new RegExp(/^[a-zA-Z0-9]+$/, 'm')

const isValidBase62 = p => re.test(p)

const joinParam = () => {
    let urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has("join") && isValidBase62(urlParams.get("join"))) {
        return { join: true, gameId: urlParams.get("join") }
    } else {
        return { join: false }
    }
}

exports.joinParam = joinParam
