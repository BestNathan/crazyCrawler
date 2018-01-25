function isArrowFunction(fn) {
    if (typeof fn !== 'function') {
        return false
    }
    try {
        class ctor extends fn{}
        return false
    } catch (error) {
        let msg = error.message
        if (msg.indexOf('[native code]') !== -1) {
            return false
        }
        return msg.indexOf('is not a constructor') !== -1
    }
}

module.exports = {
    isArrowFunction
}