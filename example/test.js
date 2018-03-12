const fn = () => {
	return ''
}

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
		console.log(msg)

		return msg.indexOf('is not a constructor') !== -1
	}
}

console.log(fn.constructor.toString())

console.log(isArrowFunction(fn))
