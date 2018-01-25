const Task = require("./task");

class Downloader {
  constructor({ maxConnection = 5, maxTask = 100 }) {
    this._maxConneciton = maxConnection;
    this._maxTask = maxTask;
    this._queue = [];
    this.handleRestTasks = null;
  }
  initQueue() {
    let restTask = this._queue.concat([]);
    this._queue = [];
    if (this.handleRestTasks && restTask.length) {
      this.handleRestTasks(restTask);
    }
  }
  setMaxConnection(maxConnection) {
    this._maxConneciton = maxConnection;
  }
  setMaxTask(maxTask) {
    this._maxTask = maxTask;
  }
  getTasksLength() {
    return this._queue.length;
  }
  onHasRestTasks(fn) {
    this.handleRestTasks = fn;
  }
  queueTask(task) {
    if (!task instanceof Task) return this;
    this._queue.push(task);
    return this;
  }
  execAll() {
    let results = [];
    let currentTasks = 0;
    return new Promise(resolve => {
      const threadImitate = limit => {
        if (currentTasks >= this._maxTask) {
          resolve(results);
          this.initQueue();
          return;
        }
        let tasks = [];
        for (let i = 0; i < limit; i++) {
          if (
            this._queue.length > 0 &&
            (this._maxTask === 0 || currentTasks < this._maxTask)
          ) {
            let task = this._queue.shift();
            tasks.push(task.exec());
            currentTasks++;
          } else {
            break;
          }
        }
        if (tasks.length > 0) {
          Promise.all(tasks).then(res => {
            res = res.filter(item => {
              if (item instanceof Task) {
                this.queueTask(item);
                return false;
              }
              return true;
            });
            results = [...results, ...res];
            threadImitate(limit);
          });
        } else {
          resolve(results);
          this.initQueue();
        }
      };
      threadImitate(this._maxConneciton);
    });
  }
  execChain() {
    const results = [];
    let currentTasks = 0;
    return new Promise((resolve, reject) => {
      const nextTask = () => {
        if (
          !this._queue.length ||
          (this._maxTask !== 0 && currentTasks >= this._maxTask)
        ) {
          resolve(results);
          this.initQueue();
          return;
        }
        let task = this._queue.shift();
        task.exec().then(res => {
          if (res instanceof Task) {
            this.queueTask(res);
          } else {
            results.push(res);
          }
          nextTask();
        });
        currentTasks++;
      };
      nextTask();
    });
  }
}

module.exports = Downloader;
