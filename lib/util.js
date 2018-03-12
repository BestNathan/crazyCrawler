const util = require('util')

function isArrowFunction(fn) {
	if (typeof fn !== 'function') {
		return false
	}
	try {
		class ctor extends fn {}
		return false
	} catch (error) {
		let msg = error.message
		if (~msg.indexOf('[native code]')) {
			return false
		}

		return msg.indexOf('is not a constructor') !== -1
	}
}

function randomIP() {
	return (
		Math.ceil(Math.random() * 255) +
		'.' +
		Math.ceil(Math.random() * 255) +
		'.' +
		Math.ceil(Math.random() * 255) +
		'.' +
		Math.ceil(Math.random() * 255)
	)
}

function isEmpty(obj) {
	if (util.isNullOrUndefined(obj)) {
		return true
	}
	return !Object.keys(obj).length
}

function parseHeader(header) {
	header = header.split('\n')

	let obj = {}

	header.forEach(item => {
		item = item.trim()
		if (item != '') {
			item = item.split(':')
			if (item.length == 2) {
				obj[item[0].trim()] = item[1].trim()
			}
		}
	})

	return obj
}

function sleep(sleep) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve('')
		}, sleep)
	})
}

function noop() {}

module.exports = {
	isArrowFunction,
	randomIP,
	isEmpty,
	parseHeader,
	noop,
	sleep
}
