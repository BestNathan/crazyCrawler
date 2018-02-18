const axios = require("axios");
const cheerio = require("cheerio");
const Model = require("./model");
const cookieHelper = require("./cookie");
const { isArrowFunction, randomIP, isEmpty } = require("./util");
const { defaultHeaders, defaultCookies } = require("./default");

class Task {
  constructor({ name = "crawlerTask", axiosOptions, handler, cookies = {} }) {
    if (isArrowFunction(handler)) {
      throw new Error("Task handler can not be an arrow funciton");
      return;
    }
    this.name = name;
    this.axiosOptions = axiosOptions;
    this.handler = handler.bind(this);
    this.cookies = cookies;
    this.unshift = false;
    this.state = {};
  }
  exec() {
    this.mergeOptions();
    this.handleCookie();
    return new Promise((resolve, reject) => {
      const handleResponse = res => {
        //add some useful properties to this
        this.headers = res.headers;
        this.request = res.request;
        this.status = res.status;
        this.data = res.data;

        let that = this;
        let type = this.headers["content-type"];
        let cookie = this.headers["set-cookie"];

        //parse cookie string to object
        if (cookie) {
          this.cookies = Object.assign(
            this.cookies,
            cookieHelper.cookieParser(cookie)
          );
        }

        //if content-type contains 'html' add $ property handled by cheerio to this
        if (type.indexOf("html") !== -1) {
          this.$ = cheerio.load(this.data);
        }

        //get result handled by custom handler
        let result = this.handler();

        //if handler return a Model object, automatically invoke save method
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
  fakeIP() {
    //fake IP by add or update 'X-Forwarded-For' and 'CLIENT_IP' header
    this.axiosOptions.headers = Object.assign({}, this.axiosOptions.headers);
    let ip = randomIP();
    this.axiosOptions.headers["X-Forwarded-For"] = ip;
    this.axiosOptions.headers["CLIENT_IP"] = ip;
  }
  handleCookie() {
    //serialize Cookie object to string which will be added to axios headers option
    let cookie = this.axiosOptions.headers["Cookie"];
    if (!cookie) {
      if (!isEmpty(this.cookies)) {
        this.axiosOptions.headers["Cookie"] = cookieHelper.cookieSerialize(
          this.cookies
        );
      }
    } else {
      this.cookies = Object.assign(
        this.cookies,
        cookieHelper.cookieParser(cookie)
      );
    }
  }
  mergeOptions() {
    this.axiosOptions.headers = Object.assign(
      {},
      defaultHeaders,
      this.axiosOptions.headers
    );

    this.cookies = Object.assign({}, defaultCookies, this.cookies);
  }
  unshiftTask() {
    this.unshift = true;
  }
}

module.exports = Task;
