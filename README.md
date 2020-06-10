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

## Examples: https://mylinuxtoybox.com/FFMPEG/index.html

## 缩放影片（scale=1280表示宽度缩放到1280，高度按对应比例, todo：mov作为源的不能预览，某个参数问题？）
   ffmpeg -i parallel_way_background.mp4 -filter:v scale=1280:-1 -c:a copy parallel_way_background1.mp4

## 切割影片(从0秒开始，持续3秒, todo：mov作为源的不能预览，某个参数问题？)
   ffmpeg -i Subscribe_green_screen1.mov -ss 00:00:00 -t 00:00:03 -async 1 Subscribe_green_screen2.mov

## 重复连接影片(4表示重复5遍)
   ffmpeg -stream_loop 4 -i parallel_way_background1.mp4 -c copy parallel_way_background_loop.mp4

## 将影片模糊处理作为背景: https://stackoverflow.com/questions/30789367/ffmpeg-how-to-convert-vertical-video-with-black-sides-to-video-169-with-blur

### 注意输出影片是1280*720,注意替换掉对应的变量
### 注意/20这里表示模糊度，数字越小越模糊

ffmpeg -i ./medias/productVideos/e9796102db67287558c53a5ba7ac247e.mp4 -lavfi "[0:v]scale=1280:-1,boxblur=luma_radius=min(h\,w)/20:luma_power=1:chroma_radius=min(cw\,ch)/20:chroma_power=1[bg];[0:v]scale=-1:720[ov];[bg][ov]overlay=(W-w)/2:(H-h)/2,crop=w=1280:h=720" output1.mp4

## 给影片添加不断重复的背景音乐
ffmpeg -y -stream_loop -1 -i "音乐地址" -i "视频地址" -map 0:a:0 -map 1:v:0 -c:v copy -c:a aac -ac 2 -shortest out.mp4

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
### 注意：-t 87 表示将输出影片截为87秒的长度
### 注意：-stream_loop -1 表示循环无数遍，配合 -t 87 将影片输出截断为主影片长度，那么能保证较短的背景video可以无限循环播放

https://stackoverflow.com/questions/10918907/how-to-add-transparent-watermark-in-center-of-a-video-with-ffmpeg

ffmpeg \
-stream_loop -1 \
-i parallel_way_background1.mp4 -i \
../productVideos/6f914acc030099609ba658472c38445c.mp4 \
-filter_complex \
"overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
-t 87 \
-codec:a copy videoOverlayBg.mp4

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

## green screen 

ffmpeg -y -i background1.mp4 -i Subscribe_green_screen2.mov -filter_complex '[1:v]colorkey=0x00FF00\:0.3\:0.2[ckout];[0:v][ckout]overlay[out]' -map '[out]' greenScreen.mp4
