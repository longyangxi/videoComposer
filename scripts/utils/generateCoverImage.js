var Jimp = require('jimp');
var fs = require("fs");


const width = 1280;
const height = 720;
const gap = 0;
const vertical = false;

async function generate(imgs, saveFile) {
    let imgDatas = await readImages(imgs);
    var image = new Jimp(width, height, function (err, image) {
        var p = 0;
        imgDatas.forEach(function(imgData){
            var w = imgData.bitmap.width;
            var h = imgData.bitmap.height;
            if(vertical) image.composite(imgData, gap, p + gap);
            else {
                image.composite(imgData, p + gap, gap);
            }
            p += vertical ? h : w;
        })
        //image.rgba( bool );             // set whether PNGs are saved as RGBA (true, default) or RGB (false)
        //image.filterType( number );     // set the filter type for the saved PNG
        //image.deflateLevel( number );   // set the deflate level for the saved PNG
        //Jimp.deflateStrategy( number ); // set the deflate for the saved PNG (0-3)
        image.write(saveFile)
    });
}

async function readImages(imgs, callback) {
    let imgDatas = [];
    for(let i = 0; i < imgs.length; i++) {
        let img = imgs[i];
        let imgData = await Jimp.read(img).catch(e => console.log);
        if(!imgData) {
            console.log("图片可能不存在: " + img)
            continue;
        }
        var w = imgData.bitmap.width;
        var h = imgData.bitmap.height;
        //缩放到高度为height
        // var scale = height / h;
        //缩放到imgs这几张图片宽度充满屏幕
        var scale = (width / imgs.length) / w;
        imgData
            .resize(w * scale, h * scale) // resize
            // .quality(60) // set JPEG quality
            // .greyscale() // set greyscale
            // .write('lena-small-bw.jpg'); // save
        imgDatas.push(imgData);    
    }
    return imgDatas;
}

module.exports = generate;
