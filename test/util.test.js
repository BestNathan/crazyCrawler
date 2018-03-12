const util = require('../lib/util')
const expect = require('chai').expect

describe('util test suite', () => {
	it('test isArrowFunction', () => {
		const fn = util.isArrowFunction

		let fnTest = () => {}
		expect(fn(fnTest)).to.be.true

		fnTest = a => a
		expect(fn(fnTest)).to.be.true

		fnTest = function(a) {
			return () => {
				return a
			}
		}

        expect(fn(fnTest)).to.be.false
        
        expect(fn('1')).to.be.false

        expect(fn(console.log)).to.be.false
	})

	it('test randomIP', () => {
		const fn = util.randomIP

		let ip = fn()

		expect(ip.split('.')).to.be.length(4)
	})

	it('test parseHeader', () => {
		const fn = util.parseHeader
		const header = `a: 1
        b:2
        c:3
        `

		expect(fn(header))
			.to.be.an('object')
			.which.have.property('a')
	})

	it('test isEmpty', () => {
		const fn = util.isEmpty

		const a = null
		const b = undefined
		const c = {}
        const d = { a: 1 }
        
        expect(fn(a)).to.be.true
        expect(fn(b)).to.be.true
        expect(fn(c)).to.be.true
        expect(fn(d)).to.be.false
	})
})
