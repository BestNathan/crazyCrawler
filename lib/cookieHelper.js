const cookie = require('cookie')

let cookieOptions = ['Path', 'Max-Age', 'Domain', 'Expires', 'SameSite']

function cookieParser(str) {
	if (Array.isArray(str)) {
		let arr = str
		str = ''
		arr.forEach(item => {
			str += item + '; '
		})
	}
	let obj = cookie.parse(str)
	cookieOptions.forEach(key => {
		delete obj[key]
		delete obj[key.toLowerCase()]
	})
	return obj
}

function cookieSerialize(cookies) {
	let str = ''
	let keys = Object.keys(cookies)
	keys.forEach(key => {
		str += key + '=' + cookies[key] + '; '
	})
	return str
}

module.exports = {
	cookieParser,
	cookieSerialize
}
