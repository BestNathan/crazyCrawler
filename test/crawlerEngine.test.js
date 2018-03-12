const { Task, TaskState, TaskChain, CrazyCrawler } = require('../index')
const expect = require('chai').expect

const baseUrl = 'https://api-promotion.mmall.com/horseActivityDetail/:id'
const url = 'https://api-promotion.mmall.com/horseActivityDetail/571'

describe('crawler engine test suite', () => {
	describe('engine test with normal task', () => {
		it('should run correctly', done => {
			const crawler = new CrazyCrawler({})
			let counter = 0
			crawler.on('done', () => {
				expect(counter).to.be.equal(1)
				done()
			})
			let task = new Task({
				name: 'first',
				url,
				handler: function(res) {
					counter++
					expect(res.data).to.be.an('object')
				}
			})

			crawler.queueTask(task).queueTask([task, task])
			crawler.run()
		})

		it('should have correct taskManager', () => {
			const crawler = new CrazyCrawler({})
			let task = new Task({
				name: 'first',
				url,
				handler: function(res) {
					expect(res.data).to.be.an('object')
				}
			})

			crawler.queueTask(task)

			expect(crawler._taskManager._tasks).to.be.length(1)
			expect(crawler._taskManager.currentTask()).to.be.null
			expect(crawler._taskManager.nextTask()).to.be.equal(task)
			expect(crawler._taskManager.currentTask()).to.be.equal(task)

			crawler._taskManager.resetQueue()
			expect(crawler._taskManager.currentTask()).to.be.null
			expect(crawler._taskManager.nextTask()).to.be.equal(task)
			expect(crawler._taskManager.currentTask()).to.be.equal(task)
		})
	})

	describe('engine test with repeat task', () => {
		it('should run correctly', done => {
			const crawler = new CrazyCrawler({})
			crawler.setMaxTask(4)
			crawler.setSleep(100)
			let counter = 0
			crawler.on('done', () => {
				expect(counter).to.be.equal(6)
				done()
			})
			let task = new Task({
				name: 'first',
				url,
				handler: function(res) {
					counter++
					crawler._downloader.setSleep(100)
					expect(res.data).to.be.an('object')
				},
				repeat: true,
				limit: 6
			})

			crawler.queueTask(task)
			crawler.run()
		})
	})

	describe('engine test with functional task', () => {
		it('should run correctly', done => {
			const crawler = new CrazyCrawler({ sleep: 20, maxTask: 3 })
			let counter = 0
			crawler.on('done', () => {
				expect(counter).to.be.equal(4)
				done()
			})
			let task = new Task({
				name: 'first',
				baseUrl,
				handler: function(res) {
					counter++
					expect(res.data).to.be.an('object')
				},
				paramSetters: {
					id: function(counter) {
						return counter + 571
					}
				},
				functional: true,
				limit: 4
			})

			crawler.queueTask(task)
			crawler.run()
		})
	})

	describe('engine test with repeat taskChain', () => {
		it('should run correctly', done => {
			const crawler = new CrazyCrawler({})
			let counter = 0
			crawler.on('done', () => {
				expect(counter).to.be.equal(10)
				done()
			})
			let firstTask = new Task({
				name: 'first',
				url,
				afterTask: function({ response }) {
					counter++
					expect(response.data).to.be.an('object')
				},
				repeat: true,
				limit: 3
			})

			let secondTask = new Task({
				name: 'second',
				url,
				afterTask: function({ response }) {
					counter++
					expect(response.data).to.be.an('object')
				},
				repeat: true,
				limit: 2
			})

			let chain = new TaskChain({ repeat: true, limit: 2 })
			chain.queue(firstTask).queue(secondTask)

			crawler.queueTask(chain)
			crawler.run()
		})
	})

	describe('engine test with functional taskChain', () => {
		it('should run correctly', done => {
			const crawler = new CrazyCrawler({})
			let counter = 0
			crawler.on('done', () => {
				expect(counter).to.be.equal(9)
				done()
			})
			let firstTask = new Task({
				name: 'first',
				baseUrl,
				afterTask: function({ response }) {
					counter++
					expect(response.data).to.be.an('object')
				},
				functional: true,
				limit: 3,
				paramSetters: {
					id: function(counter) {
						return counter + 571
					}
				}
			})

			let secondTask = new Task({
				name: 'second',
				url,
				afterTask: function({ response }) {
					counter++
					expect(response.data).to.be.an('object')
				},
				repeat: true,
				limit: 2
			})

			let chain = new TaskChain({ functional: true })
			chain.queue(firstTask).queue(secondTask)

			crawler.queueTask(chain)
			crawler.run()
		})
	})

	describe('engine test with normal taskChain', () => {
		it('should run correctly', done => {
			const crawler = new CrazyCrawler({})
			let counter = 0
			crawler.on('done', () => {
				expect(counter).to.be.equal(4)
				done()
			})
			let firstTask = new Task({
				name: 'second',
				url,
				afterTask: function({ response }) {
					counter++
					expect(response.data).to.be.an('object')
				},
				repeat: true,
				limit: 2
			})

			let secondTask = new Task({
				name: 'second',
				url,
				afterTask: function({ response }) {
					counter++
					expect(response.data).to.be.an('object')
				},
				repeat: true,
				limit: 2
			})

			let chain = new TaskChain()
			chain.queue(firstTask).queue(secondTask)

			crawler.queueTask(chain)
			crawler.run()
        })
        
	})
})
