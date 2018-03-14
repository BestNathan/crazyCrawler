'use strict'
const eventEmitter = require('events')
const Downloader = require('./downloader')
const Scheduler = require('./scheduler')
const TaskManager = require('./taskManager')
const Task = require('./task')

module.exports = class crawlerEngine extends eventEmitter {
	constructor({ maxTask = 5, sleep = 0 } = { maxTask: 5, sleep: 0 }) {
		super()
		this._downloader = new Downloader({ engine: this, maxTask, sleep })
		this._scheduler = new Scheduler(this)
		this._taskManager = new TaskManager()

		this.on('scheduler.nextTask', this._onNextTask.bind(this))
		this.on('scheduler.queue', task => {
			this._downloader.queueTask(task)
		})

		this.on('downloader.moreTask', this._onMoreTask.bind(this))
		this.on('downloader.done', () => {
			this.emit('done')
		})
	}
	_onNextTask() {
		let task = this._taskManager.nextTask()
		if (task) {
			this.emit('scheduler.task', task)
			return
		}

		this._downloader.runQueue()
	}
	_onMoreTask() {
		this._scheduler.queueToDownloader()
	}
	setMaxTask(max){
		this._downloader.setMaxTask(max)
	}
	setSleep(sleep){
		this._downloader.setSleep(sleep)
	}
	queueTask(tasks) {
		if (!Array.isArray(tasks)) {
			tasks = [tasks]
		}

		tasks.forEach(task => {
			this._taskManager.addTask(task)
		})
		return this
	}
	run() {
		this._onNextTask()
	}
}
