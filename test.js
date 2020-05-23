const { spawn } = require('child_process')
const BufferList = require('bl')
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

function spawnAsync(...args) {
  const child = spawn(...args)
  const stdout = child.stdout ? new BufferList() : ''
  const stderr = child.stderr ? new BufferList() : ''

  if (child.stdout) {
    child.stdout.on('data', data => {
      stdout.append(data)
    })
  }

  if (child.stderr) {
    child.stderr.on('data', data => {
      stderr.append(data)
    })
  }

  const promise = new Promise((resolve, reject) => {
    child.on('error', reject)

    child.on('exit', code => {
      if (code === 0) {
        resolve(stdout)
      } else {
        const err = new Error(`child exited with code ${code}`)
        err.code = code
        err.stderr = stderr
        reject(err)
      }
    })
  })

  promise.child = child

  return promise
}
