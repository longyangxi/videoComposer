var Jimp = require('jimp');
var Promise = require('promise');
var path = require('path');

var monster = './monster/new_ms029骷髅精灵/';

var cropImg = Promise.denodeify(_cropImg);

var imgDatas = [];
var width = 0;
var height = 0;
var gap = 2;
var vertical = false;

cropImages().then(function(imgData){
    var image = new Jimp(width + 2*gap, height + 2*gap, function (err, image) {
        var p = 0;
        imgDatas.forEach(function(imgData){
            var w = imgData.bitmap.width;
            var h = imgData.bitmap.height;
            if(vertical) image.composite(imgData, gap, p + gap);
            else image.composite(imgData, p + gap, gap);
            p += vertical ? h : w;
        })
        //image.rgba( bool );             // set whether PNGs are saved as RGBA (true, default) or RGB (false)
        //image.filterType( number );     // set the filter type for the saved PNG
        //image.deflateLevel( number );   // set the deflate level for the saved PNG
        //Jimp.deflateStrategy( number ); // set the deflate for the saved PNG (0-3)
        image.write("test.png")
    });
})

function cropImages(){
    var images = [];
    for(var i = 0; i < 6; i++) {
        var img = path.join(monster, "0_attack_" + i + ".png");
        images.push(img);
    }
    var p = Promise.resolve(true);
    images.forEach(function(img){
        p = p.then(function(data){
            console.log(img);
            return cropImg(img);
        })
    })
    return p
}

function _cropImg(img, callback) {
    Jimp.read(img).then(function(imgData){
        imgData = imgData.autocrop();
        imgDatas.push(imgData);
        if(vertical){
            width = Math.max(width, imgData.bitmap.width);
            height += imgData.bitmap.height;
        } else {
            width += imgData.bitmap.width;
            height = Math.max(height, imgData.bitmap.height);
        }
        callback(null, imgData);
    }).catch(function(e){
        callback(e);
    });
}


