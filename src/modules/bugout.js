const joinParam = () => {
    let urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has("join")) {
        return { join: true, gameId: urlParams.get("join") }
    } else {
        return { join: false }
    }
}

exports.joinParam = joinParam
