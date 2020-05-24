const { spawn } = require('child_process')
const fs = require("fs");

var sourceVideos = [
    'videos/6799699480162716933.mp4',
    'videos/6800048935638551814.mp4',
    'videos/6800058001735699718.mp4'
  ];
var outputVideo =  "video.mp4";

var audioFile = "ok.mp3";  
var jsonFile = "test.json5";

var json = {
    audioFilePath: audioFile,
    outPath: outputVideo,
    defaults: {
      transition: null,
      layer: { backgroundColor: 'white' },
    },
    clips: []
    }

for(var i = 0; i < sourceVideos.length; i++)
{
    json.clips.push({ layers: [{ type: 'video', path: sourceVideos[i] }] });
}    
json.clips.push();    

fs.writeFileSync(jsonFile, JSON.stringify(json));

run(sourceVideos, audioFile);

async function run(videos, audio)
{
    let audios = [];
    for(var i = 0; i < videos.length; i++) 
    {
        var v = videos[i];
        var a = "__t" + i + ".mp3";
        await toMp3(v, a);
        console.log(v + " to " + a);
        audios.push(a)
    }

    await compositeMp3(audios, audio);
    console.log(" => " + audio);

    for(var i = 0; i < audios.length; i++) 
    {
        var a = audios[i];
        fs.unlinkSync(a);
    }

    await spawnAsync("editly", [jsonFile]);

    fs.unlinkSync(audioFile);
    fs.unlinkSync(jsonFile);
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
    const process = spawn(cmd, argsArr);
    let mergedOut = '';

    process.on('error', reject);
    process.stdout.on('data', data => {
        console.log(data.toString());
    })
    process.on('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          const err = new Error(`process exited with code ${code}`)
          err.code = code
          reject(err)
        }
      })

      process.stdout.setEncoding('utf8');
      process.stdout.on('data', (chunk) => {
          process.stdout.write(chunk, (_err) => { });
          mergedOut += chunk;
      });
      
      process.on('close', (_code, _signal) => {
          // console.log('-'.repeat(30));
          // console.log(mergedOut);
      });
  });
}
