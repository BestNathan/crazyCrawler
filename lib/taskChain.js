const Task = require('./task')
const TaskState = require('./taskState')
const { isNullOrUndefined, isNumber, isFunction } = require('util')

function transBefore(lastTask, task, state, beforeTask) {
	return function ___transformedBefore() {
		return beforeTask({ lastTask, task, state })
	}
}

function transAfter(task, state, afterTask) {
	return function ___transformedAfter(response) {
		return afterTask({ task, state, response })
	}
}

class TaskChain {
	constructor({ functional = false, repeat = false, limit = 0 } = { functional: false, repeat: false }) {
		this.functional = functional
		this.limit = limit
		this.counter = 0
		this.repeat = repeat
		this.taskState = TaskState.INIT
		this.state = {}
		this.tasks = []
	}
	_checkInChian(task) {
		for (let index = 0; index < this.tasks.length; index++) {
			const ele = this.tasks[index]
			if (ele === task || (ele.copyFrom && ele.copyFrom === task)) {
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
	_hasFunctionalTask() {
		for (let index = 0; index < this.tasks.length; index++) {
			let task = this.tasks[index]
			if (task.functional) {
				return true
			}
		}
		return false
	}
	_repeatCheckLimit() {
		if (isNumber(this.limit)) {
			return this.counter < this.limit
		}

		if (isFunction(this.limit)) {
			return this.limit(this.counter)
		}

		return false
	}
	_functionalCheckLimit() {
		for (let index = 0; index < this.tasks.length; index++) {
			let task = this.tasks[index]
			if (task.functional && !task.checkLimit()) {
				return false
			}
		}
		return true
	}
	checkLimit() {
		if (this.repeat) {
			return this._repeatCheckLimit()
		}

		if (this.functional) {
			return this._functionalCheckLimit()
		}

		return false
	}
	generateTaskChain() {
		if (!this.functional) {
			return this
		}

		if (!this._hasFunctionalTask()) {
			throw new Error('functional taskChain must have at least one functional task!')
		}

		return this.repeatTaskChain()
	}
	repeatTaskChain() {
		if (!this.repeat && !this.functional) {
			return this
		}

		let chain = new TaskChain()
		let tasks = this.tasks.map(task => {
			return task.generateTask()
		})

		if (this.repeat) {
			this.counter++
		}
		return chain.queue(tasks, false)
	}
	toTask() {
		if (this.functional) {
			throw new Error('functional taskChain must be generate first!')
		}

		// this.tasks = this.tasks.map(task => {
		// 	if (task.repeat) {
		// 		let taskArray = []

		// 		while (task.checkLimit()) {
		// 			taskArray.push(task.repeatTask())
		// 		}

		// 		return taskArray
		// 	} else {
		// 		return task
		// 	}
		// })

		// this.tasks = [].concat.apply([], this.tasks)

		let firstTask
		this.tasks.reduce((lastTask, task, index) => {
			if (task.functional) {
				throw new Error('task in task chain can not be functional!')
			}

			if (index == 0) {
				// return first task of the taskChain
				firstTask = task
			}

			if (task.repeat) {
				task.counter++
			}

			if (lastTask instanceof Task) {
				lastTask.handler = () => {
					if (lastTask.repeat && lastTask.checkLimit()) {
						return lastTask.repeatTask()
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

		let task = this.tasks[this.tasks.length - 1]
		if (task.repeat) {
			task.handler = () => {
				if (task.checkLimit()) {
					return task.repeatTask()
				} else {
					return ''
				}
			}
		}

		return firstTask
	}
}

module.exports = TaskChain
