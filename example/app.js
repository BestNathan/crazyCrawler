"use strict";
const { CrazyCrawler, Task, Model } = require("../index");

class gituhbModel extends Model {
  constructor(field) {
    super(field);
  }
  save() {
    return Promise.resolve(this.field);
  }
}

const crawler = new CrazyCrawler({
  maxConnection: 5,
  maxTask: 0
});

const jsonHandler = function() {
  //console.log(this.$);
  //console.log(this.data);
  return (
    this.data.dataMap.prizeInfoList &&
    this.data.dataMap.prizeInfoList.map(item => {
      return item;
    })
  );
};

crawler.on("finish", res => {
  console.log("done", res);
});

crawler.on('progress', progress => {
  console.log(progress.index, progress.all, progress.task.name);
})

crawler.on("begin", () => {
  console.log("tasks begin at ", new Date());
});

let time = new Date(new Date().getTime() + 1000);
crawler
  .functionalTask({
    name: "hxActivities",
    baseUrl: "https://api-promotion.mmall.com/horseActivityDetail/:id",
    paramsConditions: {
      id: {
        setter: function(counter) {
          return counter + 571 + "";
        },
        limit: function(counter) {
          return counter < 6;
        }
      }
    },
    handler: jsonHandler
  })
  .exec({ mode: "chain", sleep: 1000 });
console.log("tasks settled at ", new Date());
