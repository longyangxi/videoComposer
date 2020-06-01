# videoComposer
Compose several videos into one based on node.js

# setup
1. npm install
2. brew install ffmpeg (linux系统可能是 apt-get install ffmpeg)
3. npm install -g editly (https://github.com/mifi/editly)

# verify
命令行输入ffmpeg和editly，有命令才算安装正确

# test 
node test.js

# ffmpeg

## 缩放影片（scale=1280表示宽度缩放到1280，高度按对应比例）
   ffmpeg -i background.mp4 -filter:v scale=1280:-1 -c:a copy background1.mp4

## 左右拼接影片(google: ffmpeg multiple side by side)

   ffmpeg \
  -i sourceVideos/6738264977980935430.mp4 \
  -i sourceVideos/6749437723146341637.mp4 \
 -filter_complex \
    "[0:v]pad=iw*2:ih[int]; \
     [int][1:v]overlay=W/2:0[vid]" \
-map "[vid]" \
-c:v libx264 -crf 23 \
videoSplit.mp4

## 叠加影片(google: ffmpeg overlay)  

ffmpeg \
-i background1.mp4 -i \
sourceVideos/6738264977980935430.mp4 -filter_complex \
"overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
-codec:a copy videoOverlay.mp4

## 加水印(居中)
   
ffmpeg \
-i background1.mp4 -i \
logo.png -filter_complex \
"overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
-codec:a copy videoWithMarkCenter.mp4

 ## 加水印(右下并留10像素的空白)
   
ffmpeg \
-i background1.mp4 \
-i logo.png -filter_complex \
"overlay=(main_w-overlay_w-10):(main_h-overlay_h-10)" \
-codec:a copy videoWithMarkBr.mp4
