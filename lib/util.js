const util = require('util')

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

function randomIP() {
    return Math.ceil(Math.random() * 255) + '.' + Math.ceil(Math.random() * 255) + '.' + Math.ceil(Math.random() * 255) + '.' + Math.ceil(Math.random() * 255)
}

function isEmpty(obj){
    if (util.isNullOrUndefined(obj)) {
        return true
    }
    return !Object.keys(obj).length
}

module.exports = {
    isArrowFunction,
    randomIP,
    isEmpty
}