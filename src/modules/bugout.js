exports.safeMoveNumber = 
    (playerLetter, moveNumber) => {
        if ((playerLetter === "B" && moveNumber % 2) 
            || (playerLetter === "W" && !(moveNumber % 2)))
            return moveNumber
            
        return moveNumber - 1
    }