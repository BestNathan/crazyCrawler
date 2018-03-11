const Task = require('./task')
const TaskState = require('./taskState')
const { isNullOrUndefined } = require('util')

function transBefore(lastTask, task, state, beforeTask) {
	return function ___transformedBefore() {
		beforeTask({ lastTask, task, state })
	}
}

function transAfter(task, state, afterTask) {
	return function ___transformedAfter(response) {
		afterTask({ task, state, response })
	}
}

class TaskChain {
	constructor({ functional = false, repeat = false } = { functional: false, repeat: false }) {
		this.functional = functional
		this.taskState = TaskState.INIT
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
	queue(tasks, useCopy = true) {
		if (!Array.isArray(tasks)) {
			tasks = [tasks]
		}

		tasks.forEach(task => {
			if (task instanceof Task) {
				if (!this._checkInChian(task)) {
					task.inChain = true
					if (useCopy) {
						this.tasks.push(task.copy())
					} else {
						this.tasks.push(task)
					}
				}
			} else {
				this.tasks.push(new Task(task))
			}
		})
		return this
	}
	checkLimit() {
		for (let index = 0; index < this.tasks.length; index++) {
			let task = this.tasks[index]
			if (!task.checkLimit()) {
				return false
			}
		}
		return true
	}
	generateTaskChain() {
		if (!this.functional) {
			return this
		}

		return this.repeatTaskChain()
	}
	repeatTaskChain() {
		let chain = new TaskChain()
		let tasks = this.tasks.map(task => {
			return task.generateTask()
		})
		return chain.queue(tasks, false)
	}
	toTask() {
		if (this.functional) {
			return this.generateTaskChain().toTask()
		}

		let firstTask
		this.tasks.reduce((lastTask, task, index) => {
			if (task.functional) {
				throw new Error('task in task chain can not be functional!')
			}

			if (index == 0) {
				// return first task of the taskChain
				firstTask = task
			}
			if (lastTask instanceof Task) {
				lastTask.handler = () => {
					// if repeat task
					if (lastTask.repeat && lastTask.checkLimit()) {
						return lastTask
					} else {
						return task
					}
				}
			}
			// if transform the hook
			if (!this._checkBeforeTransformed(task.beforeTask)) {
				task.beforeTask = transBefore(lastTask, task, this.state, task.beforeTask)
			}

			if (!this._checkAfterTransformed(task.afterTask)) {
				task.afterTask = transAfter(task, this.state, task.afterTask)
			}

			return task
		}, undefined)

		return firstTask
	}
}

module.exports = TaskChain
