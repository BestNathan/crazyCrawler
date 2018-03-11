'use strict'
const CrawlerEngine = require('./crawlerEngine')
const Task = require('./task')
const TaskChain = require('./taskChain')
const taskState = require('./taskState')

module.exports = class Scheduler {
	constructor(engine) {
		this._engine = engine
		this._engine.on('scheduler.task', this._onNewTask.bind(this))

		this._currentTask = null
	}
	_onNewTask(task) {
		this._currentTask = task
		this.queueToDownloader()
	}
	queueToDownloader() {
		if (!this._currentTask) {
			return
		}

		if (this._currentTask instanceof Task) {
			this.queueTaskToDownloader()
		}

		if (this._currentTask instanceof TaskChain) {
			this.queueTaskChainToDownloader()
		}
	}
	queueTaskChainToDownloader() {
		if (this._currentTask && this._currentTask.taskState === taskState.INIT) {
			if (!this._currentTask.repeat && !this._currentTask.functional) {
				this._currentTask.taskState = taskState.QUEUE
				this._engine.emit('scheduler.queue', this._currentTask.toTask())
				return
			}

			if (this._currentTask.repeat && this._currentTask.checkLimit()) {
				this._engine.emit('scheduler.queue', this._currentTask.repeatTaskChain())
				return
			}

			if (this._currentTask.functional && this._currentTask.checkLimit()) {
				this._engine.emit('scheduler.queue', this._currentTask.generateTaskChain())
				return
			}

			this._currentTask.taskState = taskState.FINISH
		}
		this._currentTask = null
		this._engine.emit('scheduler.nextTask')
	}
	queueTaskToDownloader() {
		if (this._currentTask && this._currentTask.taskState === taskState.INIT) {
			if (!this._currentTask.repeat && !this._currentTask.functional) {
				this._currentTask.taskState = taskState.QUEUE
				this._engine.emit('scheduler.queue', this._currentTask)
				return
			}

			if (this._currentTask.repeat && this._currentTask.checkLimit()) {
				this._engine.emit('scheduler.queue', this._currentTask.repeatTask())
				return
			}

			if (this._currentTask.functional && this._currentTask.checkLimit()) {
				this._engine.emit('scheduler.queue', this._currentTask.generateTask())
				return
			}

			this._currentTask.taskState = taskState.FINISH
		}
		this._currentTask = null
		this._engine.emit('scheduler.nextTask')
	}
}
