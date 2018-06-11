'use strict'
const Task = require('./task')
const CrawlerEngine = require('./crawlerEngine')
const { sleep } = require('./util')

const status = {
	IDLE: 0,
    RUNNING: 2,
    DONE: 3
}

module.exports = class Downloader {
    constructor({ engine, sleep }) {
        this._sleep = sleep
        this._engine = engine

        this._task = null
        this._status = status.IDLE
    }
    setSleep(sleep) {
        this._sleep = sleep
	}
	isIdle() {
		return this._status == status.IDLE
	}
    queueTask(task) {
		if (this._task) {
			return false
		}
		
        if (task instanceof Task) {
            this._task = task
            process.nextTick(this.runQueue.bind(this))
            return true
		}
		
		return false
    }
    runQueue() {
        if (this._status == status.RUNNING || this._status == status.DONE) {
            return
        }
        if (this._task) {
            this.exec().then(() => {
                this._engine.emit('downloader.moreTask', this)
            })
            return
        }
        this._status = status.DONE
        this._engine.emit('downloader.done', this)
    }
    async exec() {
        this._status = status.RUNNING
        while (this._task) {
            let result = await this._task.exec()

            this._task = null

            if (result instanceof Task) {
                this._task = result
            }

            if (this._sleep) {
                sleep(this._sleep)
            }
        }
        this._status = status.IDLE
    }
}
