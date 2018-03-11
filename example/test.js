let a = [1, 2]

function test() {
	a.reduce(() => {
		throw new Error('aa')
	})
}

try {
	test()
} catch (e) {
	console.log(e.message)
}
