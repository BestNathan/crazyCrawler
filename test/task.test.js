const { Task, TaskState } = require('../index')
const expect = require('chai').expect

describe('task test suite', () => {
	describe('ordinary task test', () => {
		it('should run correctly', done => {
			let task = new Task({
				name: 'inTest',
				url: 'https://api-promotion.mmall.com/horseActivityDetail/571',
				cookies: { haha: 'heihei' },
				headers: { Cookie: 'haha' },
				handler: function(res) {
					expect(res.data).to.be.an('object')
					expect(res.task).to.be.equal(task)
				},
				fakeIP: true
			})

			expect(task.checkLimit()).to.be.true

			expect(task.generateTask().name).to.be.equal('inTest')

			expect(task.taskState).to.be.equal(TaskState.INIT)

			task.changeState(TaskState.QUEUE)

			expect(task.taskState).to.be.equal(TaskState.QUEUE)

			let copy = task.copy()
			expect(copy.name).to.be.equal('inTest')

			task.exec().then(() => {
				expect(task.axiosOptions.headers)
					.to.be.an('object')
					.with.property('X-Forwarded-For')
				done()
			})
		})
	})

	describe('repeat task test', () => {
		it('should run correctly', () => {
			let task = new Task({
				name: 'repeatTest',
				url: 'https://api-promotion.mmall.com/horseActivityDetail/571',
				handler: function(res) {},
				fakeIP: true,
				repeat: true,
				limit: 2
			})

			expect(task.checkLimit()).to.be.true
			expect(task.repeatTask().name).to.be.equal('repeatTest')
			expect(task.checkLimit()).to.be.true
			task.repeatTask()
			expect(task.checkLimit()).to.be.false
		})
	})

	describe('functional task test', () => {
		it('should run correctly', () => {
			let task = new Task({
				name: 'repeatTest',
				baseUrl: 'https://api-promotion.mmall.com/horseActivityDetail/:id',
				handler: function(res) {},
				fakeIP: true,
				functional: true,
				limit: function(counter) {
					return counter < 2
				},
				paramSetters: {
					id: function(counter) {
						return counter + 571
					},
					test: 2
				}
			})

			expect(task.checkLimit()).to.be.true

			let newTask = task.generateTask()
			expect(newTask.name).to.be.equal('repeatTest.0')
			expect(newTask.url).to.be.equal('https://api-promotion.mmall.com/horseActivityDetail/571')
			expect(newTask.params)
				.to.be.an('object')
				.with.property('id')
				.which.to.be.equal(571)

			expect(task.checkLimit()).to.be.true

			newTask = task.generateTask()
			expect(newTask.name).to.be.equal('repeatTest.1')
			expect(newTask.url).to.be.equal('https://api-promotion.mmall.com/horseActivityDetail/572')
			expect(newTask.params)
				.to.be.an('object')
				.with.property('id')
				.which.to.be.equal(572)

			expect(task.checkLimit()).to.be.false
		})
	})
	describe('checkLimit fourth branch test', () => {
		it('should to be false in functional or repeat task with property limit which is not nnumber or function', () => {
			let task = new Task({
				name: 'checkLimitTest',
				baseUrl: 'https://api-promotion.mmall.com/horseActivityDetail/:id',
				handler: function(res) {},
				fakeIP: true,
				functional: true,
				limit: 'haha',
				paramSetters: {
					id: function(counter) {
						return counter + 571
					},
					test: 2
				}
			})

			expect(task.checkLimit()).to.be.false
		})
	})
	describe('html cherrio test', () => {
		it('should contain $ property', done => {
			let task = new Task({
				name: 'inTest',
				url: 'http://www.baidu.com',
				cookies: { haha: 'heihei' },
				handler: function(res) {
					expect(res.data).to.be.a('string')
					expect(res).to.be.with.property('$')
					expect(res.task).to.be.equal(task)
				},
				fakeIP: true
			})

			task.exec().then(done)
		})
	})
	describe('error handler test', () => {
		it('should log error message', done => {
			let task = new Task({
				name: 'inTest',
				url: 'https://api-promotion.mmall.com/horseActivityDetail/',
				cookies: { haha: 'heihei' },
				handler: function(res) {},
				errorHandler: function(e) {
					expect(e).to.be.instanceOf(Error)
					expect(e.message).to.be.a('string')
				},
				fakeIP: true
			})

			task.exec().then(done)
		})
	})
	describe('getter and setter test', () => {
		it('should be correct', () => {
			let task = new Task({ name: 'getter and setter test' })

			expect(task.url).to.be.empty
			expect(task.data).to.be.empty
			expect(task.headers).to.be.empty
			expect(task.method).to.be.equal('get')

			task.url = 'test'
			task.data = { test: 'test' }
			task.headers = { cookies: 'cookie' }
			task.method = 'post'

			expect(task.url).to.be.equal('test')
			expect(task.data)
				.to.be.an('object')
				.with.property('test')
			expect(task.headers)
				.to.be.an('object')
				.with.property('cookies')
			expect(task.method).to.be.equal('post')
		})
	})
})
