const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

async function fetch_search_result(query) {
  const r = await yts(query);
  const videos = r.videos.slice(0, 10);
  videos.forEach(function (v) {
    const views = String(v.views).padStart(10, " ");
    console.log(`${views} | ${v.title} (${v.timestamp}) | ${v.author.name}`);
  });
  return new Promise(function (resolve, reject) {
    resolve(videos);
  });
}

app.get("/:search", (req, res) => {
  fetch_search_result(req.params.search)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
    });
  console.log("done");
});

async function fetch_url_info(query) {
  const r = await ytdl.getInfo(query);
  return new Promise(function (resolve, reject) {
    resolve(r);
  });
}

app.post("/get", (req, res) => {
  fetch_url_info(req.body.url).then((result) => {
    res.send(result.formats);
  });
});

async function downoad_file_from_url_info(query,callback) {
  fs.readFile(`public/${query}.mp3`, (err, data) => {
    if (err) {
      const url = "https://youtube.com/watch?v=";
      const r =  ytdl(url + query, { quality: "highestaudio" }).pipe(
        fs.createWriteStream(`public/${query}.mp3`).on("close",()=>{
          console.log("done");
        }));
        r.addListener("close",()=>{
          console.log("listner");
          callback(`${query}.mp3`);
        })
    }
    if (data) {
      callback(`${query}.mp3`);
    }
  });
        
}

app.post("/download", (req, res) => {
  downoad_file_from_url_info(req.body.url,(filename)=>{
    res.send(req.protocol+"://"+req.get("host")+"/"+filename);
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
