const { spawn } = require('child_process')
const fs = require("fs");
const TikTokScraper = require('tiktok-scraper');
const md5 = require('md5');
const musicDownloader = require("./utils/musicDownloader")
const downloader = require("./utils/downloader");
const generateCoverImage = require("./utils/generateCoverImage")
const musicMetaUtil = require('music-metadata');
const util = require('util');
const translate = require("translate");

var tempFolder = "../medias/temp";  
var sourceVideosFolder = "../medias/sourceVideos"; 
var sourceVideoDataFolder = "../medias/sourceVideoDatas"; 
var outputVideoFolder =  "../medias/productVideos";

var audioFile = tempFolder + "/temp.mp3";  
var jsonFile = tempFolder + "/temp.json5";

var videoSpeed = 1;//视频播放速度

//youtube横屏尺寸：1920×1080 / 1280×720
var json = {
    // width: 1280, height: 720,//fps: 15,
    // audioFilePath: audioFile,
    outPath: "todo",
    defaults: {
      //editly中的transition类型
    //   const randomTransitionsSet = ['fade', 'fadegrayscale', 'directionalwarp', 'crosswarp', 'dreamyzoom', 'burn', 'crosszoom', 'simplezoom', 'linearblur', 'directional-left', 'directional-right', 'directional-up', 'directional-down'];   
      transition: null,//{ name: 'fade', duration: 1},//随机的转场效果, 如果是 random 表示从上面的随机
      layer: { 
          backgroundColor: 'black',
          fontPath: "Baloo-Regular.ttf"
       },
    //   duration: 30
    },
    clips: []
}
let textTemplate = fs.readFileSync("./texts/pet.txt", "utf-8");
let videoConfig = JSON.parse(fs.readFileSync(process.argv[2] || "./video.json"));
compose(videoConfig.videos, videoConfig.music, videoConfig.covers, "");
// compositeMp3(["../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3","../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3","../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3","../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3","../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3", "../medias/sourceMusics/freepd/Silly Intro.mp3"], "test.mp3")

// generateCoverImage(["../medias/sourceVideos/6704779914064809218.jpg", "../medias/sourceVideos/6796886810669681922.jpg", "../medias/sourceVideos/6825794724058713349.jpg"]);
// wideVideoAndBlurBack("../medias/sourceVideos/6829133319599344902.mp4", 1280, 720, "test.mp4");
// compose(dogNotGoodVideos, 9);//, "comedy");//, "../medias/sourceMusics/freepd/Silly Intro.mp3");//"comedy");
// let music = "../medias/sourceMusics/freepd/Adventure.mp3";
// compositeMp3([music,music,music,music,music,music,music,music,music,music], audioFile)

async function prepare(sourceVideos, markTxt, useOriginSound)
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

    //封面
    // json.clips.push({ duration: 3, layers: [{ type: 'puase', color: "red" }, { type: 'title', text: "Let's GO" }] })
    // json.clips.push({ duration: 3, layers: [{ type: 'rainbow-colors'}, { type: 'title', text: "Let's GO" }] })

    let localVideos = [];
    let texts = [];
    let hashTags = [];
    let videoDatas = {};
    let videoCovers = [];
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
        videoCovers.push(localVideoCoverFile);

        //解析hashtag
        let txts = videoData.text.split("#");
        let titleTxt = txts[0] || " ";
        let theTags = txts.slice(1);
        for(let j = 0; j < theTags.length; j++)
        {
            let theTag = theTags[j].replace(/\s/g, "");
            if(hashTags.indexOf(theTag) == -1) {
                hashTags.push(theTag);
            }
        }

        hashTags.sort((a, b) => {
            if(a.length < b.length) return -1;
            else return 1;
        })

        //https://translate.yandex.com/
        translate.engine = 'yandex';
        // translate.engine = 'google';
        translate.key = 'trnsl.1.1.20200524T114704Z.0743ec0ad3be4831.e8bad52fc61288a31202466c3af5e5eb72412809';
        let titleTxt_en = await translate(titleTxt, {from:"ja", to: "en"}).catch(e => {
            titleTxt_en = titleTxt;
        })
        console.log(titleTxt, titleTxt_en)
        titleTxt = titleTxt_en;

        //标题
        texts.push({txt: titleTxt, t: formatTime(totalDuration)});
        //时长
        let vDuration = videoData.videoMeta.duration;
        totalDuration += vDuration;

        //////////////////////组合视频/////////////////////////////
        // if(!useOriginSound) {
        //     json.clips.push({ duration: Math.min(2, titleTxt.split(" ").length * 0.3), layers: [
        //         //将视频截图作为每段视频的起始效果
        //         { type: 'image', path: localVideoCoverFile, zoomDirection: 'out' },
        //         { type: 'subtitle', text: titleTxt, position: "bottom" }
        //     ] })
        // }
        
        // console.log(i + ": " + titleTxt + ", " + titleTxt.split(" ").length * 0.3);

        let videoDefine = { 
            type: 'video', //video, image, title, subtitle, title-background, fill-color, pause, radial-gradient, linear-gradient,rainbow-colors, canvas, gl, fabric
            path: localVideoPath, 
            resizeMode: 'contain'  /* cover, stretch, contain */
            };

        //截取视频的从cutFrom秒开始，到cutTo秒结束    
        videoDefine.cutFrom = 0;
        videoDefine.cutTo = vDuration;// * videoSpeed;
        let clipLayers = [
            videoDefine,
            {type: 'subtitle', text: titleTxt, position: "bottom", textColor:"#ffffff"}
        ];
        if(markTxt) {
            clipLayers.push({type: "title", position: "top", text: markTxt || "", textColor: "#cccccc"})
        }
        json.clips.push({
            //videoSpeed越大，时间越短，加速了
            duration: vDuration / videoSpeed, 
            layers: clipLayers 
        });

        // json.clips.push({ duration: 3, layers: [{ type: 'pause' }] })
        //////////////////////组合视频/////////////////////////////

    }   
    fs.writeFileSync(jsonFile, JSON.stringify(json));
    return {videos: localVideos, videoDatas, videoCovers, totalDuration, texts, hashTags, outPath: json.outPath};
}

async function compose(sourceVideos, theMusic, coversIndex, markTxt)
{
    let {videos, videoDatas, videoCovers, totalDuration, texts, hashTags, outPath} = await prepare(sourceVideos, markTxt, theMusic == null);

    let videoExist = false;
    if(fs.existsSync(outPath)) {
        console.log("The video " + json.outPath + " exists!")
        videoExist = true;
    }

    //输出文字和tag
    let textFile = outPath.replace(".mp4", ".txt");
    
    let timeline = "";
    for(let i = 0; i < texts.length; i++) {
        let txt = texts[i];
        timeline += txt.t + " " + txt.txt + "\n";
    }

    //create text
    textTemplate = textTemplate.replace("${timeline}", timeline);
    textTemplate = textTemplate.replace("${hashtags}", "#" + hashTags.join(", #"));

    fs.writeFileSync(textFile, textTemplate);

    //指定了cover序号，否则随机
    let coverFile = outPath.replace(".mp4", ".jpg");
    if(coversIndex && coversIndex.length) {
        let coversPath = [];
        for(let i  = 0; i < coversIndex.length; i++) {
            coversPath.push(videoCovers[parseInt(coversIndex[i])]);
        }
        await generateCoverImage(coversPath, coverFile);
    } else {
        await generateCoverImage(randomFromArray(videoCovers, 3), coverFile);
    }
    
    if(!videoExist) await spawnAsync("editly", [jsonFile]);

    //根据配置生成背景音乐
    let {music, tempMusic} = await createBackgroudMusic(videos, theMusic, totalDuration, false);
    let videoPathWithSound = outPath.replace(".mp4", "_s.mp4");
    await mergetLoopAudioToVideo(outPath, music, videoPathWithSound);
    
    //转为宽视频，并模糊背景
    await wideVideoAndBlurBack(videoPathWithSound, 1280, 720, videoPathWithSound.replace(".mp4", "w.mp4"));

    if(fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);
    if(fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
    if(tempMusic && fs.existsSync(tempMusic)) fs.unlinkSync(tempMusic);
    // fs.unlinkSync(tempFolder);
}

async function createBackgroudMusic(videos, theMusic, totalDuration, loopMusic) {
    let tempMusic;
    let music;
    //指定乐曲
    if(theMusic) {
        //指定某个视频里的音乐
        if(parseInt(theMusic) >= 0) {
            tempMusic = music = await getOneAudioFromVideos(videos, parseInt(theMusic))
        } //指定路径的音乐
        else if(theMusic.indexOf(".mp3") > -1) {
            if(theMusic.indexOf("http") > -1) {
                tempMusic = tempFolder + "/__download.mp3";
                await downloader(theMusic, tempMusic);
                music = tempMusic;
            } else {
                music = theMusic;
            }
        //下载freepd网站指定音乐 
        } else {
            music = await musicDownloader(theMusic);
        }

        //重复音乐到视频长度，暂时好些不用了，直接ffmpeg的命令搞定
        if(loopMusic) {
            //重复曲子，以免音乐不够长
            let metadata = await musicMetaUtil.parseFile(music)
            .catch( err => {
                console.error(err.message);
            });
            let musicDuration = metadata.format.duration;
            let duplicateCount = Math.ceil(totalDuration / musicDuration);
            console.log("音乐长度: " + musicDuration + ", 需重复：" + duplicateCount);
            let musicArr = [];
            while(duplicateCount--) {
                musicArr.push(music);
            }
            await compositeMp3(musicArr, audioFile)
        }
        
        fs.writeFileSync(jsonFile, JSON.stringify(json));
    //将源视频片段声音拼接    
    } else {
        music = await mergeAudioFromVideos(videos);
    }
    return {music, tempMusic};
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
    return audioFile;
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

//ffmpeg -f concat -i list.txt -c copy out.mp3
async function wideVideoAndBlurBack(src, w, h, to)
{
    if(fs.existsSync(to)) {
        fs.unlinkSync(to);
    }
    var cmd = 'ffmpeg';
    var blur = 20;//数字越大越清晰
    var args = [
        "-i", src,
        "-lavfi", `[0:v]scale=${w}:-1,boxblur=luma_radius=min(h\\,w)/${blur}:luma_power=1:chroma_radius=min(cw\\,ch)/${blur}:chroma_power=1[bg];[0:v]scale=-1:${h}[ov];[bg][ov]overlay=(W-w)/2:(H-h)/2,crop=w=${w}:h=${h}`,
        to
    ];
    //直接运行又点问题，该做手动命令吧
    // return spawnAsync(cmd, args);
    args[3] = '"' + args[3] + '"';
    console.log("Run to get a youtube video: \nffmpeg " + args.join(" "));
}

//将一段音乐循环，添加到视频里
//ffmpeg -y -stream_loop -1 -i "音乐地址" -i "视频地址" -map 0:a:0 -map 1:v:0 -c:v copy -c:a aac -ac 2 -shortest out.mp4
async function mergetLoopAudioToVideo(inputVideo, music, outputVideo) {
    var cmd = 'ffmpeg';
    var args = [
        "-y", "-stream_loop", "-1",
        "-i", music,
        "-i", inputVideo,
        "-map", "0:a:0", "-map", "1:v:0", "-c:v", "copy", "-c:a", "aac", "-ac", "2", "-shortest",
        outputVideo
    ];
    return spawnAsync(cmd, args);
}

function spawnAsync(cmd, argsArr) {
    console.log(cmd, argsArr.join(" "));
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
            cProcess.stdout.write(chunk, (_err) => { if(_err) console.log(_err) });
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
      return (paddingStrWithZero(min, 2) + ":" + paddingStrWithZero(sec, 2))
  }

  function paddingStrWithZero(str, num) 
  {
      str = "" + str;
      while(str.length  <  num) {
          str = "0" + str;
      }
      return str;
  }

  function randomFromArray(imgArr, count)
  {
        if(imgArr.length <= count) return imgArr;
        let arr = imgArr.concat();
        let result = [];
        while(result.length < count) {
            let i = Math.floor(Math.random() * arr.length);
            if(result.indexOf(arr[i]) == -1) {
                result.push(arr[i]);
                arr.splice(i, 1);
            }
        }
        return result;
  }
