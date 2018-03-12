'use strict'
const { CrazyCrawler, Task, TaskChain } = require('../index')

const crawler = new CrazyCrawler({})

crawler.on('done', () => {
	console.log('done')
})

let firstTask = new Task({
	name: 'first',
	url: 'https://api-promotion.mmall.com/horseActivityDetail/571',
	afterTask: function({ state, response }) {
		console.log(response.data)
		state.id = 571
	}
})

let secondTask = new Task({
	name: 'second',
	url: 'https://api-promotion.mmall.com/horseActivityDetail/',
	beforeTask: function({ state, task }) {
		state.id++
		let url = task.url + state.id
		task.url = url
	},
	afterTask: function({ response }) {
		console.log(response.data)
	}
})

let chain = new TaskChain()

chain.queue([firstTask, secondTask])

crawler.queueTask(chain)

crawler.run()
