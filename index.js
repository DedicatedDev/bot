const express = require("express");
const cron = require("node-cron");
const Parser = require("rss-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const moment = require("moment");

const parser = new Parser();

const app = express();
app.set("port", process.env.PORT || 8090);

app.get("/", function (req, res) {
  res.send("Hello world");
});
// Upwork Bot
const MessageBot = (
  username = "@freebird0323",
  text,
  html_format = "yes",
  link_preview = "yes"
) => {
  const botAPI = `https://api.callmebot.com/text.php?user=${username}&text=${text}&html=${html_format}&links=${link_preview}`;

  fetch(botAPI).then((res) => console.log("Successed sent message:", res));
};

const getJobId = (guid) => {
  const ampecentIndex = guid.indexOf("%");
  const questionIndex = guid.indexOf("?");
  const jobId = guid.slice(ampecentIndex + 1, questionIndex);
  return jobId;
};
// Node cronjob
cron.schedule("* * * * *", () => {
  const rawData = fs.readFileSync("lastJob.json");
  const lastGuid = JSON.parse(rawData);

  (async () => {
    let feed = await parser.parseURL(
      "https://www.upwork.com/ab/feed/topics/rss?securityToken=f6cfb45210209ca9ddfc893fcdbeca8de2fa6d1e971a750f794e7ce4223ef48aa63117047f32f60919a5d3c678b728d00f9d6d8bb38edd4e05d0507b286d9c20&userUid=1185743111097253888&orgUid=1185743111109836801&topic=5151743"
    );

    const title = feed.items[0].title;
    const content = feed.items[0].content;
    const link = feed.items[0].link;
    const guid = feed.items[0].guid;
    const pubDate = feed.items[0].pubDate;
    const newTimestamp = moment(pubDate).valueOf();
    const lastTimestamp = lastGuid.timestamp;
    const newJobId = getJobId(guid);
    const lastJobId = getJobId(lastGuid.guid);

    console.log("Title:", title);
    if (!(newJobId === lastJobId) && newTimestamp > lastTimestamp) {
      writelastFeed(guid, newTimestamp);
      MessageBot(
        "@freebird0323",
        encodeURI(title + "<a>" + link + "</a>"),
        "yes",
        "yes"
      );
    }
  })();
});
// Write last guid to json file
const writelastFeed = (guid, timestamp) => {
  const data = JSON.stringify({ guid: guid, timestamp: timestamp });
  fs.writeFileSync("lastJob.json", data);
};

app.listen(app.get("port"));
