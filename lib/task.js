const axios = require("axios");
const Parser = require("./parser");
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

        let type = this.headers["content-type"];
        let result = null;
        if (type.indexOf("html") !== -1) {
          this.parser = Parser.fromHtml(this.data);
          result = this.parser.handle$(this.handler);
        } else if (type.indexOf("json") !== -1) {
          this.parser = Parser.fromJson(this.data);
          result = this.parser.handleJson(this.handler);
        } else {
          this.parser = new Parser(this.data);
          result = this.parser.handleOriginal(this.handler);
        }
        if (result instanceof Model) {
          try {
            result
            .save()
            .then(res => resolve(res))
            .catch(e => resolve(e));
          } catch (e) {
            resolve(e)
          }
          return
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
