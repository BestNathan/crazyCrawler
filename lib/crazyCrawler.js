"use strict";
const schedule = require("node-schedule");
const event = require("events");

const Downloader = require("./downloader");
const Task = require("./task");
const { randomIP } = require("./util");

const defaultSetter = () => "";
const defaultLimit = counter => counter < 1;
const testLimits = (limits, counter) => {
  for (let key in limits) {
    if (!limits[key](counter)) {
      return false;
    }
  }
  return true;
};

class CrazyCrawler extends event {
  constructor({ maxConnection, maxTask }) {
    super();
    this.downloader = new Downloader({ maxConnection, maxTask });
    this._taskIdentity = 0
    this.downloader.onHasRestTasks(restTasks => {
      this.emit("restTask", restTasks);
    });
    this.downloader.on("progress", progress => {
      this.emit("progress", progress);
    });
  }
  setMaxConnection(maxConnection) {
    this.downloader.setMaxConnection(maxConnection);
  }
  setMaxTask(maxTask) {
    this.downloader.setMaxTask(maxTask);
  }
  getTasksLength() {
    return this.downloader.getTasksLength();
  }
  exec({ time, mode = "chain", sleep = 0 }) {
    if (time) {
      let tasks = this.downloader.getTasksQueue();
      this.downloader.initQueue();
      schedule.scheduleJob(time, () => {
        this.downloader.setTasksQueue(tasks);
        this.exec({ mode, sleep });
      });
      return;
    }
    this.downloader.setChainSleep(sleep);
    this.emit("begin", this.getTasksLength());
    switch (mode) {
      case "chain":
        this.downloader.execChain().then(res => this.emit("finish", res));
        break;
      case "all":
        this.downloader.execAll().then(res => this.emit("finish", res));
        break;
      default:
        this.downloader.execChain().then(res => this.emit("finish", res));
        break;
    }
  }
  queue({ name, url, method = "GET", data, headers, handler }) {
    if (typeof url !== "string" || typeof method !== "string") {
      throw new Error("URL and METHOD should be String");
      return;
    }
    if (!url || url.indexOf("http") == -1) {
      throw new Error(
        "URL can not be null and must be complete with http or https schema"
      );
      return;
    }
    name = name || 'crawler' + this._taskIdentity++
    method = method.toUpperCase();
    let axiosOptions = {
      url,
      method,
      data,
      headers
    };
    this.downloader.queueTask(
      new Task({
        name,
        axiosOptions,
        handler
      })
    );
    return this;
  }
  post({ name, url, data, handler }) {
    return this.queue({
      name,
      url,
      method: "POST",
      data,
      handler
    });
  }
  get({ name, url, handler }) {
    return this.queue({
      name,
      url,
      handler
    });
  }
  functionalTask({
    name,
    baseUrl,
    method = "GET",
    baseData,
    headers,
    handler,
    paramsConditions,
    fakeIP = false
  }) {
    let params = {};
    let setters = {};
    let settersPattern = ":";
    let limits = {};
    let counter = 0;
    let url;
    let data;
    for (let key in paramsConditions) {
      let setter, limit;
      //处理setter
      if (!paramsConditions[key].setter) {
        continue;
      }
      setter = paramsConditions[key].setter;
      if (typeof setter !== "function") {
        continue;
      }
      if (typeof setter(0) === "undefined") {
        setter = defaultSetter;
      }
      //处理limit
      if (!paramsConditions[key].limit) {
        limit = defaultLimit;
      } else {
        limit = paramsConditions[key].limit;
      }
      if (typeof limit !== "function" || typeof limit(0) === "undefined") {
        limit = defaultLimit;
      }

      setters[key] = setter;
      limits[key] = limit;
    }

    while (testLimits(limits, counter)) {
      for (let key in setters) {
        params[key] = setters[key](counter);
      }
      url = baseUrl;
      data = baseData;
      for (let key in params) {
        //替换url
        settersPattern = ":" + key;
        if (url.indexOf(settersPattern) != -1) {
          url = url.replace(settersPattern, params[key]);
        }
        //替换data
        if (data && typeof data[key] !== "undefined") {
          data[key] = params[key];
        }
      }

      name = name || 'crawler' + this._taskIdentity++
      let task = new Task({
        name: name + "." + counter,
        axiosOptions: {
          url,
          method,
          data,
          headers
        },
        handler
      });
      task.params = Object.assign({}, params);
      if (fakeIP) {
        task.fakeIP()
      }
      this.downloader.queueTask(task);

      counter++;
      params = {};
    }
    return this;
  }
}

module.exports = CrazyCrawler;
