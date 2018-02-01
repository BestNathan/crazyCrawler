const axios = require("axios");
const cheerio = require("cheerio");
const Model = require("./model");
const cookieHelper = require("./cookie")
const { isArrowFunction, randomIP, isEmpty } = require("./util");

class Task {
  constructor({ name = "crawlerTask", axiosOptions, handler, cookies }) {
    if (isArrowFunction(handler)) {
      throw new Error("Task handler can not be an arrow funciton");
      return;
    }
    this.name = name;
    this.axiosOptions = axiosOptions;
    this.handler = handler.bind(this);
    this.cookies = cookies
    this.state = {};
  }
  exec() {
    this.parseCookie()
    return new Promise((resolve, reject) => {
      const handleResponse = res => {
        this.headers = res.headers;
        this.request = res.request;
        this.status = res.status;
        this.data = res.data;

        let that = this;
        let type = this.headers["content-type"];
        let cookie = this.headers["set-cookie"]

        this.cookies = Object.assign(this.cookies, cookieHelper.cookieParser(cookie))

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
  fakeIP() {
    this.axiosOptions.headers = Object.assign({}, this.axiosOptions.headers);
    let ip = randomIP();
    this.axiosOptions.headers["X-Forwarded-For"] = ip;
    this.axiosOptions.headers["CLIENT_IP"] = ip;
  }
  parseCookie(){
    if (!this.axiosOptions.headers['Cookie'] && !isEmpty(this.cookies)) {
      this.axiosOptions.headers['Cookie'] = cookieHelper.cookieSerialize(this.cookies)
    }
  }
}

module.exports = Task;
