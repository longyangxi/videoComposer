const { spawn } = require('child_process')
const fs = require("fs");
const TikTokScraper = require('tiktok-scraper');
const md5 = require('md5');
const musicDownloader = require("./utils/musicDownloader")
const downloader = require("./utils/downloader");

const {heartDogVideos, memeDogVideos, loveDogVideos, dogNotGoodVideos} = require("./videoGroupConfig/videoGroup_dog");

var tempFolder = "../medias/temp";  
var sourceVideosFolder = "../medias/sourceVideos"; 
var sourceVideoDataFolder = "../medias/sourceVideoDatas"; 
var outputVideoFolder =  "../medias/productVideos";

var audioFile = tempFolder + "/temp.mp3";  
var jsonFile = tempFolder + "/temp.json5";

//youtube横屏尺寸：1920×1080 / 1280×720
var json = {
    // width: 1280, height: 720,//fps: 15,
    audioFilePath: audioFile,
    outPath: "todo",
    defaults: {
      //editly中的transition类型
    //   const randomTransitionsSet = ['fade', 'fadegrayscale', 'directionalwarp', 'crosswarp', 'dreamyzoom', 'burn', 'crosszoom', 'simplezoom', 'linearblur', 'directional-left', 'directional-right', 'directional-up', 'directional-down'];   
      transition: { name: 'fade', duration: 1},//随机的转场效果, 如果是 random 表示从上面的随机
      layer: { backgroundColor: 'black' },
    //   duration: 30
    },
    clips: []
}

compose(dogNotGoodVideos, "comedy");
// let music = "../medias/sourceMusics/freepd/Adventure.mp3";
// compositeMp3([music,music,music,music,music,music,music,music,music,music], audioFile)

async function prepare(sourceVideos)
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
        return {};
    }

    //封面
    // json.clips.push({ duration: 3, layers: [{ type: 'puase', color: "red" }, { type: 'title', text: "Let's GO" }] })
    // json.clips.push({ duration: 3, layers: [{ type: 'rainbow-colors'}, { type: 'title', text: "Let's GO" }] })

    let localVideos = [];
    let videoDatas = {};
    let videoCovers = {};
    let totalDuration = 0;

    for(var i = 0; i < sourceVideos.length; i++)
    {
        let videoUrl = sourceVideos[i];
        let videoFile = videoUrl.split("/");
        videoFile = videoFile[videoFile.length - 1];
        let localVideoDataFile = sourceVideoDataFolder + "/" + videoFile + ".json";
        let localVideoCoverFile = sourceVideosFolder + "/" + videoFile + ".jpg";
        if(videoFile.indexOf(".mp4") == -1) videoFile += ".mp4";
        let localVideoPath = sourceVideosFolder + "/" + videoFile;
        
        let downloadSuc = true;

        //下载视频
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

        //获取视频数据信息
        let videoData;
        if(!fs.existsSync(localVideoDataFile)) {
            if(videoUrl.indexOf("tiktok.com/@") > -1) {
                console.log("Parse: " + videoFile + " data!");
                videoData = await TikTokScraper.getVideoMeta(videoUrl, {download: false, noWaterMark: false})
                .catch(e => {
                    console.log(e);
                    downloadSuc = false;
                })
                fs.writeFileSync(localVideoDataFile, JSON.stringify(videoData));
            }
        } else {
            videoData = JSON.parse(fs.readFileSync(localVideoDataFile, "utf-8"));
        }
        
        if(!downloadSuc) continue;

        //下载视频的截图
        if(!fs.existsSync(localVideoCoverFile)) {
            if(videoUrl.indexOf("tiktok.com/@") > -1) {
                await downloader(videoData.imageUrl, localVideoCoverFile);
            }
        }
        
        localVideos.push(localVideoPath);
        videoDatas[localVideoPath] = videoData;
        videoCovers[localVideoPath] = localVideoCoverFile;
        totalDuration += videoData.videoMeta.duration;

        //////////////////////组合视频/////////////////////////////
        json.clips.push({ duration: 3, layers: [
            //将视频截图作为每段视频的起始效果
            { type: 'image', path: localVideoCoverFile, duration: 3, zoomDirection: 'out' },
            // { type: 'title-background', text: 'Speed up or slow down video', background: { type: 'radial-gradient' } },
           /* { type: 'rainbow-colors'}, */{ type: 'title', text: "#" + (i + 1), position: "bottom" }
        ] })

        json.clips.push({layers: [
            { 
            type: 'video', //video, image, title, subtitle, title-background, fill-color, pause, radial-gradient, linear-gradient,rainbow-colors, canvas, gl, fabric
            path: localVideoPath, 
            resizeMode: 'contain'  /* cover, stretch, contain */
            }
            // { type: 'title', text: "#" + (i + 1), position: "bottom"}
        ] 
        });

        // json.clips.push({ duration: 3, layers: [{ type: 'pause' }] })
        //////////////////////组合视频/////////////////////////////

    }   
    fs.writeFileSync(jsonFile, JSON.stringify(json));
    return {videos: localVideos, videoDatas, videoCovers, totalDuration};
}

async function compose(sourceVideos, musicType)
{
    let {videos, videoDatas, totalDuration} = await prepare(sourceVideos);
    if(!videos) return;

    try{
        fs.unlinkSync(audioFile);
        fs.unlinkSync(jsonFile);
    }catch (e) { console.log(e)}
    
    //指定乐曲
    if(musicType) {
        let music = await musicDownloader(musicType);
        //重复曲子，以免音乐不够长
        await compositeMp3([music,music,music,music,music,music,music,music,music,music], audioFile)
        // json.audioFilePath = audioFile;
        fs.writeFileSync(jsonFile, JSON.stringify(json));
    //将源视频片段声音拼接    
    } else {
        mergeAudioFromVideos(videos);
    }
    
    await spawnAsync("editly", [jsonFile]);

    try{
        fs.unlinkSync(audioFile);
        fs.unlinkSync(jsonFile);
    }catch (e) { console.log(e)}
    // fs.unlinkSync(tempFolder);
}

//将系列视频的音频提取合并为一个
async function mergeAudioFromVideos(videos)
{
    let audios = [];
    for(var i = 0; i < videos.length; i++) 
    {
        var v = videos[i];
        var a = tempFolder + "/__t" + i + ".mp3";
        await videoToMp3(v, a);
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

//ffmpeg -i filestore/6809350863975369990.mp4 test.mp3
async function videoToMp3(from, to)
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
  
      cProcess.on('error', err => {
          console.log(err);
          reject(err);
      });
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
