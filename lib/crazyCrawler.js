"use strict";
const schedule = require("node-schedule");
const event = require("events");

const Downloader = require("./downloader");
const Task = require("./task");

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
  constructor({ maxConnection, maxTask}) {
    super();
    this.downloader = new Downloader({ maxConnection, maxTask });
    this.downloader.onHasRestTasks(restTasks => {
        this.emit('restTask', restTasks)
    })
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
  exec({ time, mode = "chain" }) {
    if (time) {
      schedule.scheduleJob(time, () => {
        this.exec({ mode });
      });
      return;
    }
    this.emit('begin', this.getTasksLength())
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
    paramsConditions
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
      name = name + '.' + counter
      this.queue({
        name,
        url,
        method,
        data,
        headers,
        handler
      });

      counter++;
      params = {};
    }
    return this;
  }
}


module.exports = CrazyCrawler