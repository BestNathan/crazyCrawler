'use strict'
const Task = require('./task')
const CrawlerEngine = require('./crawlerEngine')
const { sleep } = require('./util')

module.exports = class Downloader {
	constructor({ engine, maxTask, sleep }) {
		this._maxTask = maxTask
		this._sleep = sleep
		this._engine = engine

		this._taskQueue = []
	}
	setSleep(sleep) {
		this._sleep = sleep
	}
	setMaxTask(max){
		this._maxTask = max
	}
	queueTask(task) {
		if (task instanceof Task) {
			this._taskQueue.push(task)

			if (this._taskQueue.length < this._maxTask) {
				this._engine.emit('downloader.moreTask')
			} else {
				this.runQueue()
			}
		}
	}
	runQueue() {
		if (this._taskQueue.length) {
			this.exec().then(() => {
				this._engine.emit('downloader.moreTask')
			})
			return
		}
		this._engine.emit('downloader.done')
	}
	async exec() {
		while (this._taskQueue.length) {
			let task = this._taskQueue.shift()

			if (task instanceof Task) {
				let res = await task.exec()

				if (this._sleep) {
					await sleep(this._sleep)
				}

				if (res instanceof Task) {
					this._taskQueue.push(res)
				}
			}
		}
	}
}
