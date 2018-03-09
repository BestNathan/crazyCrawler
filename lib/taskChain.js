const Task = require('./task')
const { isNullOrUndefined } = require('util')

function transBefore(lastTask, task, state) {
	return function ___transformedBefore() {
		task.beforeTask({ lastTask, task, state })
	}
}

function transAfter(task, state) {
	return function ___transformedAfter() {
		task.afterTask({ task, state })
	}
}

class TaskChain {
	constructor() {
		this.state = {}
		this.tasks = []
	}
	_checkInChian(task) {
		for (let index = 0; index < this.tasks.length; index++) {
			const ele = this.tasks[index]
			if (ele === task) {
				return true
			}
		}
		return false
	}
	_checkBeforeTransformed(fn) {
		return fn.name === '___transformedBefore'
	}
	_checkAfterTransformed(fn) {
		return fn.name === '___transformedAfter'
	}
	clearQueue() {
		this.tasks = []
		return this
	}
	queue(tasks) {
		if (!Array.isArray(tasks)) {
			tasks = [tasks]
		}

		tasks.forEach(task => {
			if (task instanceof Task) {
				if (!this._checkInChian(task)) {
					task.inChain = true
					this.tasks.push(task)
				}
			} else {
				let { url, method, data, headers } = task
				this.tasks.push(new Task({ ...task, axiosOptions: { url, method, data, headers }, inChain: true }))
			}
		})
		return this
	}
	toTask({ fakeIP } = { fakeIP: false }) {
		let firstTask
		this.tasks.reduce((lastTask, task, index) => {
			if (index == 0) {
				// return first task of the taskChain
				firstTask = task
			}
			if (lastTask instanceof Task) {
				lastTask.handler = () => {
					// if repeat task
					if (lastTask.repeat && lastTask.execTimes < lastTask.repeat) {
						return lastTask
					} else {
						return task
					}
				}
			}
			// if transform the hook
			if (!this._checkBeforeTransformed(task.beforeTask)) {
				task.beforeTask = transBefore(lastTask, task, this.state)
			}

			if (!this._checkAfterTransformed(task.beforeTask)) {
				task.afterTask = transAfter(task, this.state)
			}
			// unshift task
			task.unshiftTask()

			// if fake IP
			if (fakeIP) {
				task.fakeIP()
			}

			return task
		}, undefined)

		return firstTask
	}
}

module.exports = TaskChain
