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

compose(dogNotGoodVideos, 6);//, "comedy");//, "../medias/sourceMusics/freepd/Silly Intro.mp3");//"comedy");
// let music = "../medias/sourceMusics/freepd/Adventure.mp3";
// compositeMp3([music,music,music,music,music,music,music,music,music,music], audioFile)

async function prepare(sourceVideos, useOriginSound)
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
    let texts = [];
    let hashTags = [];
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

        //解析hashtag
        let txts = videoData.text.split("#");
        let titleTxt = txts[0];// || " ";
        let theTags = txts.slice(1);
        for(let j = 0; j < theTags.length; j++)
        {
            let theTag = theTags[j].replace(/\s/g, "");
            if(hashTags.indexOf(theTag) == -1) {
                hashTags.push(theTag);
            }
        }
        //标题
        texts.push({txt: titleTxt, t: formatTime(totalDuration)});
        //时长
        totalDuration += videoData.videoMeta.duration;

        //////////////////////组合视频/////////////////////////////
        // if(!useOriginSound) {
        //     json.clips.push({ duration: Math.min(2, titleTxt.split(" ").length * 0.3), layers: [
        //         //将视频截图作为每段视频的起始效果
        //         { type: 'image', path: localVideoCoverFile, zoomDirection: 'out' },
        //         { type: 'subtitle', text: titleTxt, position: "bottom" }
        //     ] })
        // }
        
        // console.log(i + ": " + titleTxt + ", " + titleTxt.split(" ").length * 0.3);

        json.clips.push({layers: [
            { 
            type: 'video', //video, image, title, subtitle, title-background, fill-color, pause, radial-gradient, linear-gradient,rainbow-colors, canvas, gl, fabric
            path: localVideoPath, 
            resizeMode: 'contain'  /* cover, stretch, contain */
            },
            { type: 'subtitle', text: titleTxt, position: "bottom" }
        ] 
        });

        // json.clips.push({ duration: 3, layers: [{ type: 'pause' }] })
        //////////////////////组合视频/////////////////////////////

    }   
    fs.writeFileSync(jsonFile, JSON.stringify(json));
    return {videos: localVideos, videoDatas, videoCovers, totalDuration, texts, hashTags};
}

async function compose(sourceVideos, theMusic)
{
    let {videos, videoDatas, totalDuration, texts, hashTags} = await prepare(sourceVideos, theMusic == null);

    if(!videos) return;

    if(fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);
    if(fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
    
    let tempMusic;
    //指定乐曲
    if(theMusic) {
        let music;
        if(parseInt(theMusic) >= 0) {
            tempMusic = music = await getOneAudioFromVideos(videos, parseInt(theMusic))
        } //指定路径的音乐
        else if(theMusic.indexOf(".mp3") > -1) {
            music = theMusic;
        //指定某个视频里的背景音乐    
        } 
        else {
            music = await musicDownloader(theMusic);
        }
        //重复曲子，以免音乐不够长
        //todo
        await compositeMp3([music,music,music,music,music,music,music,music,music,music,music,music,music,music,music,music,music,music], audioFile)
        // json.audioFilePath = audioFile;
        fs.writeFileSync(jsonFile, JSON.stringify(json));
    //将源视频片段声音拼接    
    } else {
        await mergeAudioFromVideos(videos);
    }
    await spawnAsync("editly", [jsonFile]);

    if(fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);
    if(fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
    if(tempMusic && fs.existsSync(tempMusic)) fs.unlinkSync(tempMusic);
    // fs.unlinkSync(tempFolder);
}

//将系列视频第index的背景音乐提取出来
async function getOneAudioFromVideos(videos, index)
{
    var v = videos[index];
    var a = tempFolder + "/__t" + index + ".mp3";
    if(fs.existsSync(a)) fs.unlinkSync(a);
    await videoToMp3(v, a);
    console.log(v + " to " + a);
    return a;
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
            cProcess.stdout.write(chunk, (_err) => { console.log(_err) });
            // mergedOut += chunk;
            // console.log(data);
        });
        cProcess.stdout.on('error', function( err ) {
          if (err.code == "EPIPE") {
              process.exit(0);
          } else {
              console.log(err);
          }
        });
        
        cProcess.on('close', (_code, _signal) => {
            // console.log('-'.repeat(30));
            // console.log(mergedOut);
        });
    });
  }

  //秒到 分:秒 格式转换
  function formatTime(seconds)
  {
      let min = Math.floor(seconds / 60);
      let sec = seconds - min * 60;
      return (paddingStrWithZero(min, 2) + ": " + paddingStrWithZero(sec, 2))
  }

  function paddingStrWithZero(str, num) 
  {
      str = "" + str;
      while(str.length  <  num) {
          str = "0" + str;
      }
      return str;
  }
