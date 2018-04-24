'use strict'
const eventEmitter = require('events')
const Downloader = require('./downloader')
const Scheduler = require('./scheduler')
const TaskManager = require('./taskManager')
const Task = require('./task')

module.exports = class crawlerEngine extends eventEmitter {
    constructor({ maxTask = 5, sleep = 0 } = { maxTask: 5, sleep: 0 }) {
        super()
        this._bufferTask = []
        this._downloaders = new Set()
        for (let i = 0; i < maxTask; i++) {
            this._downloaders.add(new Downloader({ engine: this, sleep }))
        }
        this._scheduler = new Scheduler(this)
        this._taskManager = new TaskManager()
        this._doneCounter = 0

        this.on('scheduler.nextTask', this._onNextTask.bind(this))
        this.on('scheduler.queue', task => {
            let flag = false
            this._downloaders.forEach(downLoader => {
                if (!flag) {
                    flag = downLoader.queueTask(task)
                }
            })

            if (!flag) {
                this._bufferTask.push(task)
            }

            process.nextTick(this._checkIdle.bind(this))
        })

        this.on('downloader.moreTask', this._onMoreTask.bind(this))
        this.on('downloader.done', downLoader => {
            this._downloaders.delete(downLoader)
            this._doneCounter++
            if (this._doneCounter >= maxTask || this._downloaders.size == 0) {
                this.emit('done')
            }
        })
    }
    _checkIdle() {
        let flag = false
        this._downloaders.forEach(downLoader => {
            if (!flag && downLoader.isIdle()) {
                this._onMoreTask()
                flag = true
            }
        })
    }
    _onNextTask() {
        let task = this._taskManager.nextTask()
        if (task) {
            this.emit('scheduler.task', task)
            return
        }

        this._downloaders.forEach(d => {
            d.runQueue()
        })
    }
    _onMoreTask() {
        if (this._bufferTask.length) {
            this.emit('scheduler.queue', this._bufferTask.shift())
            return
        }
        this._scheduler.queueToDownloader()
    }
    setSleep(sleep) {
        this._downloaders.forEach(downLoader => {
            downLoader.setSleep(sleep)
        })
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
