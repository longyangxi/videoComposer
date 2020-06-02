
const downloader = require("./downloader");
const request = require("request");
const fs = require("fs");

const musicFolder = "../medias/sourceMusics";

// CC0的免版权的音乐

//1. http://freepd.com
const freepdHost = "https://freepd.com";

const freepdList = {
   upbeat: "https://freepd.com/upbeat.php",
   epic: "https://freepd.com/epic.php",
   horror: "https://freepd.com/horror.php",
   romantic: "https://freepd.com/romantic.php",
   comedy: "https://freepd.com/comedy.php",
   world: "https://freepd.com/world.php",
   scoring: "https://freepd.com/scoring.php",
   electronic: "https://freepd.com/electronic.php",
   misc: "https://freepd.com/misc.php"
   //更多列表： https://freepd.com/Page2/
}

// const freepdMusicReq = /\<A\sclass\=\"downloadButton\"\sHREF\=".*\.mp3\"\>/g;
const freepdMusicReq = /HREF\=".*\.mp3\"\>/g;

//a[class=downloadButton][href]

async function musicDownloader(category)
{
    return new Promise((resolve, reject) => {
        let catUrl = freepdList[category];
        request({url: catUrl}, async function(err, response, body) {
            if(!err && body) {
                let hrefs = body.match(freepdMusicReq);
                for(let i = 0; i < hrefs.length; i++) {
                    let href = hrefs[i];
                    href = href.replace('HREF="', "");
                    href = href.replace('">', "");
                    hrefs[i] = freepdHost + href;
                }
                let randomMusic = hrefs[Math.floor(Math.random() * hrefs.length)];
                let musicName = randomMusic.split("/");
                musicName = musicName[musicName.length - 1];
                let musicPath = musicFolder + "/freepd/" + musicName;
                if(!fs.existsSync(musicPath)) {
                    await downloader(randomMusic, musicPath);
                }
                resolve(musicPath);
            } else {
                reject(err);
            }
        });
    })
   
}

module.exports = musicDownloader;
// musicDownloader("epic");

