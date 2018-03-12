'use strict'
const Task = require('./task')
const TaskChain = require('./taskChain')

module.exports = class TaskManager {
	constructor() {
		this._index = -1
		this._tasks = []
	}
	addTask(task) {
		if (task instanceof Task || task instanceof TaskChain) {
			this._tasks.push(task)
		}
	}
	currentTask() {
		if (this._index < 0 || this._index > this._tasks.length) {
            return null
        }
        return this._tasks[this._index]
    }
    nextTask(){
        this._index++
        if (this._index > this._tasks.length) {
            return null
        }
        return this._tasks[this._index]
    }
    resetQueue(){
        this._index = -1
    }
}
