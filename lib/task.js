const axios = require("axios");
const cheerio = require('cheerio')
const Model = require("./model");
const { isArrowFunction } = require("./util");

class Task {
  constructor({ name = "crawlerTask", axiosOptions, handler }) {
    if (isArrowFunction(handler)) {
      throw new Error("Task handler can not be an arrow funciton");
      return;
    }
    this.name = name;
    this.axiosOptions = axiosOptions;
    this.handler = handler.bind(this);
    this.state = {};
  }
  exec() {
    return new Promise((resolve, reject) => {
      const handleResponse = res => {
        this.headers = res.headers;
        this.request = res.request;
        this.status = res.status;
        this.data = res.data;

        let that = this
        let type = this.headers["content-type"];

        if (type.indexOf("html") !== -1) {
          this.$ = cheerio.load(this.data);
        }

        let result = this.handler();
        if (result instanceof Model) {
          try {
            result = result.save();
            if (result instanceof Promise) {
              result.then(res => resolve(res)).catch(e => resolve(e));
            } else {
              resolve(result);
            }
          } catch (e) {
            resolve(e);
          }
          return;
        }
        return resolve(result);
      };
      try {
        axios(this.axiosOptions)
          .then(res => handleResponse(res))
          .catch(e => resolve(e));
      } catch (e) {
        resolve(e);
      }
    });
  }
  getName() {
    return this.name;
  }
}

module.exports = Task;
