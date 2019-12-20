const storageType = 'localStorage'

const storageAvailable = () => {
    var storage;
    try {
        storage = window[storageType];
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
}

const fromStorage = () => {
    let v = `${Math.floor(Math.random() * 10)}59d761e-be99-464f-a3c0-22bfdd7d1f9e`
    console.log(`id ${v}`)
    return v
}


exports.fromStorage = fromStorage 
