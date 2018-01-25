"use strict";
const { Crawler, Task, Model } = require("../index");

class gituhbModel extends Model {
  constructor(field) {
    super(field);
  }
  save() {
    return Promise.resolve(this.field);
  }
}

const crawler = new Crawler({
  maxConnection: 5,
  maxTask: 0
});

const jsonHandler = function(json) {
  return (
    json.dataMap.prizeInfoList &&
    json.dataMap.prizeInfoList.map(item => {
      return item;
    })
  );
};

crawler.on("finish", res => {
  console.log("done", res);
});

crawler.on("begin", () => {
  console.log("tasks begin at ", new Date());
});

let time = new Date(new Date().getTime() + 5000);
crawler
  .functionalTask({
    name: "hxActivities",
    baseUrl: "https://api-promotion.mmall.com/horseActivityDetail/:id",
    paramsConditions: {
      id: {
        setter: function(counter) {
          return counter + 440 + "";
        },
        limit: function(counter) {
          return counter < 5;
        }
      }
    },
    handler: jsonHandler
  })
  // .get({
  //   name: "githubTrending",
  //   url: "http://github.com/trending/javascript",
  //   handler: function githubTrendingHandler($) {
  //     let items = $(
  //       "body > div:nth-child(4) > div.explore-pjax-container.container-lg.p-responsive.clearfix > div > div.col-md-9.float-md-left > div.explore-content > ol"
  //     ).children("li");
  //     let result = [];
  //     items.each(function(i, el) {
  //       let $$ = $(el);
  //       let repo = $$.find(".d-inline-block.col-9.mb-1 > h3 > a")
  //         .text()
  //         .trim();
  //       let href =
  //         "https://github.com" +
  //         $$.find(".d-inline-block.col-9.mb-1 > h3 > a").attr("href");
  //       let descriptions = $$.find(".py-1 > p")
  //         .text()
  //         .trim();
  //       let allStars = $$.find(".f6.text-gray.mt-2 > a:nth-child(2)")
  //         .text()
  //         .trim();
  //       let increaseStars = $$.find(
  //         ".f6.text-gray.mt-2 > span.d-inline-block.float-sm-right"
  //       )
  //         .text()
  //         .trim()
  //         .match(/^[0-9]*[1-9][0-9]*/)[0];
  //       result.push({ repo, href, descriptions, allStars, increaseStars });
  //     });
  //     return new gituhbModel(result)
  //   }
  // })
  .exec({ time, mode: "chain" });
console.log("tasks settled at ", new Date());
