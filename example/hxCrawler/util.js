const fs = require('fs')
const crypto = require('crypto')

function read(path) {
	if (fs.existsSync(path)) {
		return fs.readFileSync(path).toString()
	}

	return ''
}

function write(path, content) {
	content = content.endsWith('\r\n') ? content : content + '\r\n'
	if (fs.existsSync(path)) {
		fs.appendFileSync(path, content)
	} else {
		fs.writeFileSync(path, content)
	}
}

const MD5 = source => {
	let hash = crypto.createHash('md5')
	hash.update(source)
	return hash.digest('hex')
}

module.exports = {
	read,
	write,
	MD5
}
