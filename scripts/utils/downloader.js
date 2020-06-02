const url = require('url');
const fs = require('fs');
const request = require('request');
const PassThrough = require('stream').PassThrough;

async function download(url, fileName) {
    return new Promise((resolve, reject) => {
      var stream = new PassThrough();
      var req = request(url);
  
      req.on('response', function(resp) {
        stream.emit('response', resp);
      });
    
      req.pipe(stream);

      stream.pipe(fs.createWriteStream(fileName))
      .on('error', (e) => {
        console.log(e);
        reject(e);
      })
      .on('finish', () => {
        // console.log("voer....")
        resolve();
      })
    });
    
  };

  module.exports = download;