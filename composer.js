const { spawn } = require('child_process')
const fs = require("fs");
const TikTokScraper = require('tiktok-scraper');
const md5 = require('md5');
const musicDownloader = require("./musicDownloader")

var sourceVideos = [
    "https://www.tiktok.com/@salavat.fidai/video/6831537531763330310","https://www.tiktok.com/@salavat.fidai/video/6828136451310456069","https://www.tiktok.com/@salavat.fidai/video/6826368439737732357","https://www.tiktok.com/@salavat.fidai/video/6821909449477868805","https://www.tiktok.com/@salavat.fidai/video/6820027797440875782","https://www.tiktok.com/@salavat.fidai/video/6813737581839142150","https://www.tiktok.com/@salavat.fidai/video/6810025398206844166","https://www.tiktok.com/@salavat.fidai/video/6789931494014979334","https://www.tiktok.com/@salavat.fidai/video/6779458250241821958","https://www.tiktok.com/@salavat.fidai/video/6765846196369067269","https://www.tiktok.com/@salavat.fidai/video/6764034986443099397","https://www.tiktok.com/@salavat.fidai/video/6759564204946083078","https://www.tiktok.com/@salavat.fidai/video/6752479425335545094","https://www.tiktok.com/@salavat.fidai/video/6752112687599127813","https://www.tiktok.com/@salavat.fidai/video/6751776190580772101","https://www.tiktok.com/@salavat.fidai/video/6750659391608884486","https://www.tiktok.com/@salavat.fidai/video/6749437723146341637","https://www.tiktok.com/@salavat.fidai/video/6738348723190910213","https://www.tiktok.com/@salavat.fidai/video/6738264977980935430"
  ];

var tempFolder = "temp";  
var sourceVideosFolder = "sourceVideos";  
var outputVideoFolder =  "productVideos";

var audioFile = tempFolder + "/temp.mp3";  
var jsonFile = tempFolder + "/temp.json5";

//youtube横屏尺寸：1920×1080 / 1280×720
var json = {
    width: 1280, height: 720,//fps: 15,
    audioFilePath: audioFile,
    outPath: "todo",
    defaults: {
      //editly中的transition类型
    //   const randomTransitionsSet = ['fade', 'fadegrayscale', 'directionalwarp', 'crosswarp', 'dreamyzoom', 'burn', 'crosszoom', 'simplezoom', 'linearblur', 'directional-left', 'directional-right', 'directional-up', 'directional-down'];   
      transition: { name: 'directional-down', duration: 2},//随机的转场效果, 如果是 random 表示从上面的随机
      layer: { backgroundColor: 'black' },
      duration: 30
    },
    clips: []
}

// 这个可以叠加影片，卧槽，只是影片大小
//https://stackoverflow.com/questions/35269387/ffmpeg-overlay-one-video-onto-another-video
// ffmpeg -i background.mp4 -i sourceVideos/6738264977980935430.mp4 -filter_complex "[1:v]setpts=PTS-10/TB[a]; [0:v][a]overlay=enable=gte(t\,5):shortest=1[out]" -map [out] -map 0:a -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a copy test.mp4

//缩放影片
//ffmpeg -i background.mp4 -filter:v scale=1280:-1 -c:a copy background1.mp4

//todo
//    const info = await TikTokScraper.getVideoMeta(url);
//.imageUrl 或 covers.origin 用来在每个影片前做显示3秒？
// text 标题 组合新标题，再自动翻译中文？
//hashtags: 貌似text中就包含了哦
compose("epic");

async function prepare()
{
    try{
        fs.mkdirSync(tempFolder);
    } catch (e) {}

    let sourceVideosStr = "";
    for(var i = 0; i < sourceVideos.length; i++)
    {
        let videoUrl = sourceVideos[i];
        sourceVideosStr += videoUrl;
    }
    json.outPath = outputVideoFolder + "/" +  md5(sourceVideosStr) + ".mp4";

    if(fs.existsSync(json.outPath)) {
        console.log("The video " + json.outPath + " exists!")
        return null;
    }

    // json.clips.push({ duration: 3, layers: [{ type: 'puase', color: "red" }, { type: 'title', text: "Let's GO" }] })
    json.clips.push({ duration: 3, layers: [{ type: 'rainbow-colors'}, { type: 'title', text: "Let's GO" }] })

    let localVideos = [];
    for(var i = 0; i < sourceVideos.length; i++)
    {
        let videoUrl = sourceVideos[i];
        let videoFile = videoUrl.split("/");
        videoFile = videoFile[videoFile.length - 1];
        if(videoFile.indexOf(".mp4") == -1) videoFile += ".mp4";
        let localVideoPath = sourceVideosFolder + "/" + videoFile;
        
        let downloadSuc = true;
        if(!fs.existsSync(localVideoPath)) {
            if(videoUrl.indexOf("tiktok.com/@") > -1) {
                console.log("Downloading: " + videoUrl);
                await TikTokScraper.video(videoUrl, {noWaterMark: true, hdVideo: false, download: true, filepath: sourceVideosFolder})
                .catch(e => {
                    console.log(e);
                    downloadSuc = false;
                })
            } else {
                //todo
                console.log("There is no video file: " + localVideos);
            }
        }
        
        if(!downloadSuc) continue;
        
        localVideos.push(localVideoPath);

        json.clips.push({ duration: 3, layers: [
            { type: 'rainbow-colors'}, { type: 'title', text: "NO. " + (i + 1) }
        ] })

        json.clips.push({layers: [
            { type: 'rainbow-colors'},//todo，下层看不见，被挡住啦
            { 
            type: 'video', //video, image, title, subtitle, title-background, fill-color, pause, radial-gradient, linear-gradient,rainbow-colors, canvas, gl, fabric
            path: localVideoPath, 
            resizeMode: 'contain'  /* cover, stretch, contain */
            }
        ] 
        });

        // json.clips.push({ duration: 3, layers: [{ type: 'pause' }] })

    }   
    fs.writeFileSync(jsonFile, JSON.stringify(json));
    return localVideos;
}

async function compose(musicType)
{
    let videos = await prepare();
    if(!videos) return;

    if(musicType) {
        let music = await musicDownloader(musicType);
        json.audioFilePath = music;
        fs.writeFileSync(jsonFile, JSON.stringify(json));
    } else {
        let audios = [];
        for(var i = 0; i < videos.length; i++) 
        {
            var v = videos[i];
            var a = tempFolder + "/__t" + i + ".mp3";
            await toMp3(v, a);
            console.log(v + " to " + a);
            audios.push(a)
        }
    
        await compositeMp3(audios, audioFile);
        console.log(" => " + audioFile);
    
        for(var i = 0; i < audios.length; i++) 
        {
            var a = audios[i];
            fs.unlinkSync(a);
        }
    }
    

    await spawnAsync("editly", [jsonFile]);

    if(!musicType) fs.unlinkSync(audioFile);
    fs.unlinkSync(jsonFile);
    // fs.unlinkSync(tempFolder);
}

//ffmpeg -i filestore/6809350863975369990.mp4 test.mp3
async function toMp3(from, to)
{
    var cmd = 'ffmpeg';

    var args = [
        "-i", from,
        to
    ];

    return spawnAsync(cmd, args);
}

//ffmpeg -i "concat:test.mp3|test1.mp3" -acodec copy output.mp3
async function compositeMp3(sources, result)
{
    var cmd = 'ffmpeg';

    sources = sources.join("|");
    var args = [
        "-i", "concat:" + sources,
        "-acodec",
        "copy",
        result
    ];

    return spawnAsync(cmd, args);
}

function spawnAsync(cmd, argsArr) {
    return new Promise(function (resolve, reject) {
      const cProcess = spawn(cmd, argsArr);
      let mergedOut = '';
  
      cProcess.on('error', reject);
      cProcess.stdout.on('data', data => {
          console.log(data.toString());
      })
      cProcess.on('exit', code => {
          if (code === 0) {
            resolve();
          } else {
            const err = new Error(`process exited with code ${code}`)
            err.code = code
            reject(err)
          }
        })
  
        cProcess.stdout.setEncoding('utf8');
        cProcess.stdout.on('data', (chunk) => {
            cProcess.stdout.write(chunk, (_err) => { });
            mergedOut += chunk;
        });
        cProcess.stdout.on('error', function( err ) {
          if (err.code == "EPIPE") {
              process.exit(0);
          }
        });
        
        cProcess.on('close', (_code, _signal) => {
            // console.log('-'.repeat(30));
            // console.log(mergedOut);
        });
    });
  }
