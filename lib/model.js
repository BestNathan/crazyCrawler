module.exports = class Model {
  constructor(field) {
    this.field = field;
  }
  save() {
    return Promise.resolve(this.field);
  }
}
