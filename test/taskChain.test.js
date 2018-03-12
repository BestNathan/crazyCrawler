const { Task, TaskState, TaskChain } = require('../index')
const expect = require('chai').expect

const url = 'https://api-promotion.mmall.com/horseActivityDetail/571'
const badUrl = 'https://api-promotion.mmall.com/horseActivityDetail/'
const baseUrl = 'https://api-promotion.mmall.com/horseActivityDetail/:id'

describe('taskChain test suite', () => {
	describe('test some branch', () => {
		let chain = new TaskChain({})

		expect(chain.checkLimit()).to.be.false

		chain = new TaskChain({ repeat: true, limit: '2' })

		expect(chain.checkLimit()).to.be.false

		chain = new TaskChain({
			repeat: true,
			limit: function(counter) {
				return counter < 2
			}
		})

		expect(chain.checkLimit()).to.be.true
	})

	describe('basic test', () => {
		it('should run correcct orderly with tow normal task', () => {
			let firstTask = new Task({
				name: 'first',
				url,
				afterTask: function({ state, response }) {
					state.id = 571
				}
			})

			let secondTask = new Task({
				name: 'second',
				url: badUrl,
				beforeTask: function({ state, task }) {
					state.id++
					let url = task.url + state.id
					task.url = url
				},
				afterTask: function({ response }) {}
			})

			let chain = new TaskChain()
			let task = chain
				.queue(firstTask)
				.queue(secondTask)
				.toTask()

			expect(task.name).to.be.equal('first')
			expect(task.handler().name).to.be.equal('second')

			expect(chain.repeatTaskChain()).to.be.equal(chain)
			expect(chain.generateTaskChain()).to.be.equal(chain)

			expect(chain.tasks).to.be.length(2)
			chain.clearQueue()
			expect(chain.tasks).to.be.length(0)
		})

		it('should run correcct orderly with a normal task and a repeat task', () => {
			let firstTask = new Task({
				name: 'first',
				url,
				afterTask: function({ state, response }) {
					state.id = 571
				},
				repeat: true,
				limit: 2
			})

			let secondTask = new Task({
				name: 'second',
				url: badUrl,
				beforeTask: function({ state, task }) {
					state.id++
					let url = task.url + state.id
					task.url = url
				},
				afterTask: function({ response }) {}
			})

			let chain = new TaskChain()
			let task = chain
				.queue(firstTask)
				.queue(secondTask)
				.toTask()

			expect(task.name).to.be.equal('first')

			let nextTask = task.handler()
			expect(nextTask.name).to.be.equal('first')

			nextTask = nextTask.handler()
			expect(nextTask.name).to.be.equal('second')
		})

		it('should occur an Error with one task is functional', () => {
			let firstTask = new Task({
				name: 'first',
				url,
				afterTask: function({ state, response }) {
					state.id = 571
				},
				functional: true,
				limit: 2
			})

			let secondTask = new Task({
				name: 'second',
				url: badUrl,
				beforeTask: function({ state, task }) {
					state.id++
					let url = task.url + state.id
					task.url = url
				},
				afterTask: function({ response }) {}
			})

			let chain = new TaskChain()
			try {
				let task = chain
					.queue(firstTask)
					.queue(secondTask)
					.toTask()
			} catch (e) {
				expect(e.message).to.be.include('can not be functional')
			}
		})

		it('should occur an Error with no task is functional in functional taskChain', () => {
			let firstTask = new Task({
				name: 'first',
				url,
				afterTask: function({ state, response }) {
					state.id = 571
				},
				limit: '2'
			})

			let secondTask = new Task({
				name: 'second',
				url: badUrl,
				beforeTask: function({ state, task }) {
					state.id++
					let url = task.url + state.id
					task.url = url
				},
				afterTask: function({ response }) {}
			})

			let chain = new TaskChain({ functional: true })
			try {
				let task = chain
					.queue(firstTask)
					.queue(secondTask)
					.generateTaskChain()
			} catch (e) {
				expect(e.message).to.be.include('at least one functional task')
			}
		})
	})

	describe('repeat taskChain test', () => {
		it('should run correctly', () => {
			let firstTask = new Task({
				name: 'first',
				url,
				afterTask: function({ state, response }) {
					state.id = 571
				}
			})

			let secondTask = new Task({
				name: 'second',
				url: badUrl,
				beforeTask: function({ state, task }) {
					state.id++
					let url = task.url + state.id
					task.url = url
				},
				afterTask: function({ response }) {}
			})

			let chain = new TaskChain({ repeat: true, limit: 2 })

			expect(chain.checkLimit()).to.be.true

			let newChain = chain
				.queue(firstTask)
				.queue(secondTask)
				.repeatTaskChain()

			expect(chain.checkLimit()).to.be.true

			let chainTask = chain.toTask()
			let newChainTask = newChain.toTask()

			expect(chainTask.name).to.be.equal(newChainTask.name)
			expect(chainTask.handler().name).to.be.equal(newChainTask.handler().name)

			chain.repeatTaskChain()

			expect(chain.checkLimit()).to.be.false
		})
	})

	describe('functional taskChain test', () => {
		it('should run correctly', () => {
			let firstTask = new Task({
				name: 'first',
				baseUrl,
				paramSetters: {
					id: function(counter) {
						return counter + 571
					}
				},
				limit: 2,
				functional: true
			})

			let secondTask = new Task({
				name: 'second',
				baseUrl,
				paramSetters: {
					id: function(counter) {
						return counter + 573
					}
				},
				limit: 3,
				functional: true
			})

			let chain = new TaskChain({ functional: true })

			chain
				.queue(firstTask)
				.queue(secondTask)
				.queue(secondTask)
			expect(chain.tasks).to.be.length(2)

			try {
				chain.toTask()
			} catch (e) {
				expect(e.message).to.be.include('functional taskChain must be generate first')
			}

			expect(chain.checkLimit()).to.be.true
			let newChain = chain.generateTaskChain()

			let newChainTask = newChain.toTask()

			expect(newChainTask.name).to.be.equal('first.0')
			expect(newChainTask.params)
				.to.be.an('object')
				.with.property('id')
				.which.to.be.equal(571)
			expect(newChainTask.handler().name).to.be.equal('second.0')
			expect(newChainTask.handler().params)
				.to.be.an('object')
				.with.property('id')
				.which.to.be.equal(573)

			expect(chain.checkLimit()).to.be.true
			newChain = chain.generateTaskChain()
			newChainTask = newChain.toTask()

			expect(newChainTask.name).to.be.equal('first.1')

			expect(chain.checkLimit()).to.be.false
		})
	})
})
