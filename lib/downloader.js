const Task = require('./task')
const event = require('events')
const util = require('util')

const sleep = sleep => {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve('')
		}, sleep)
	})
}

class Downloader extends event {
	constructor({ maxConnection = 5, maxTask = 100, maxQueues = 100 }) {
		super()
		this._maxConneciton = maxConnection
		this._maxTask = maxTask
		this._maxQueues = maxQueues
		this._queue = []
		this.handleRestTasks = null
	}
	initQueue() {
		let restTask = this._queue.concat([])
		this._queue = []
		if (this.handleRestTasks && restTask.length) {
			this.handleRestTasks(restTask)
		}
	}
	setMaxConnection(maxConnection) {
		this._maxConneciton = maxConnection
	}
	setMaxTask(maxTask) {
		this._maxTask = maxTask
	}
	setChainSleep(sleep) {
		this.sleep = sleep
	}
	getTasksLength() {
		return this._queue.length
	}
	setTasksQueue(tasks) {
		if (!Array.isArray(tasks)) {
			return
		}
		if (!tasks.length || !(tasks[0] instanceof Task)) {
			return
		}
		this._queue = tasks.concat([])
	}
	getTasksQueue() {
		return this._queue.concat([])
	}
	onHasRestTasks(fn) {
		this.handleRestTasks = fn
	}
	queueTask(task) {
		if (!task instanceof Task) return this
		if (this._queue.length >= this._maxQueues) return this
		this._queue.push(task)
		return this
	}
	unshiftTask(task) {
		if (!task instanceof Task) return this
		if (this._queue.length >= this._maxQueues) return this
		this._queue.unshift(task)
		return this
	}
	clearTasksByName(name) {
		let identity = name.substring(0, name.indexOf('.'))
		this._queue = this._queue.filter(task => task.name.indexOf(identity) === -1)
	}
	execAll() {
		let results = []
		let currentTasks = 0
		return new Promise(resolve => {
			const threadImitate = limit => {
				if (currentTasks >= this._maxTask) {
					resolve(results)
					this.initQueue()
					return
				}
				let tasks = []
				for (let i = 0; i < limit; i++) {
					if (this._queue.length > 0 && (this._maxTask === 0 || currentTasks < this._maxTask)) {
						let task = this._queue.shift()
						tasks.push(task.exec())
						currentTasks++
					} else {
						break
					}
				}
				if (tasks.length > 0) {
					Promise.all(tasks).then(res => {
						res = res.filter(item => {
							if (item instanceof Task) {
								this.queueTask(item)
								return false
							}
							return true
						})
						results = [...results, ...res]
						threadImitate(limit)
					})
				} else {
					resolve(results)
					this.initQueue()
				}
			}
			threadImitate(this._maxConneciton)
		})
	}
	async execChain() {
		let results = []
		let currentTasks = 0
		let all = this._maxTask == 0 ? this._queue.length : Math.min(this._maxTask, this._queue.length)

		const nextTask = async () => {
			let task = this._queue.shift()
			let res = await task.exec()
			this.emit('progress', {
				index: currentTasks,
				all,
				task
			})
			if (res instanceof Task) {
				if (res == task) {
					this.unshiftTask(res)
					currentTasks--
				} else {
					all++
					res.unshift ? this.unshiftTask(res) : this.queueTask(res)
				}
			} else {
				if (util.isBoolean(res) && !res) {
					this.clearTasksByName(task.name)
				}
				Array.isArray(res) ? results.push(...res) : results.push(res)
			}
			currentTasks++
		}

		while (this._queue.length && (this._maxTask === 0 || currentTasks < this._maxTask)) {
			await nextTask()
			await sleep(this.sleep)
		}

		this.initQueue()
		return results
	}
}

module.exports = Downloader
