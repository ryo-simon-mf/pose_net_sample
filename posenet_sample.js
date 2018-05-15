// このプログラムは
// https://github.com/tensorflow/tfjs-models/tree/master/posenet/demos
// および
// https://github.com/tensorflow/tfjs-models/blob/master/posenet/demos/camera.js
// をもとに作成しました。

const imageScaleFactor = 0.2;
const outputStride = 16;
const flipHorizontal = false;
const stats = new Stats();
const contentWidth = 800;
const contentHeight = 600;
const ballNum = 2;
const colors = ["red","blue","green"];

let balls = [];
balls = initBalls(ballNum);
bindPage();

async function bindPage() {
    const net = await posenet.load();
    let video;
    try {
        video = await loadVideo();
    } catch(e) {
        console.error(e);
        return;
    }
    detectPoseInRealTime(video, net);
}

async function loadVideo() {
    const video = await setupCamera();
    video.play();
    return video;
}

async function setupCamera() {
    const video = document.getElementById('video');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
            'audio': false,
            'video': true});
        video.srcObject = stream;

        return new Promise(resolve => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } else {
        const errorMessage = "This browser does not support video capture, or this device does not have a camera";
        alert(errorMessage);
        return Promise.reject(errorMessage);
    }
}

function detectPoseInRealTime(video, net) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const flipHorizontal = true; // since images are being fed from a webcam

    async function poseDetectionFrame() {
        stats.begin();
        let poses = [];
        const pose = await net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
        poses.push(pose);

        ctx.clearRect(0, 0, contentWidth,contentHeight);

        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-contentWidth, 0);
        ctx.drawImage(video, 0, 0, contentWidth, contentWidth);
        ctx.restore();

        poses.forEach(({ score, keypoints }) => {
            drawWristPoint(keypoints[9],ctx);
            drawWristPoint(keypoints[10],ctx);
            ballsDecision(ctx,[keypoints[9],keypoints[10]]);
        });


        stats.end();

        requestAnimationFrame(poseDetectionFrame);
    }
    poseDetectionFrame();
}

function drawWristPoint(wrist,ctx){
    ctx.beginPath();
    ctx.arc(wrist.position.x , wrist.position.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "pink";
    ctx.fill();
}

function ballsDecision(ctx,wrists){
    for(i=0;i<ballNum;i++){
        wrists.forEach((wrist) => {
            if((balls[i].x - 50)  <= wrist.position.x && wrist.position.x <= (balls[i].x + 50) &&
               (balls[i].y - 50) <= wrist.position.y && wrist.position.y <= (balls[i].y + 50)){
                balls[i] = resetBall();
                return;
            } else {
                balls[i].y += 20;
                if (balls[i].y > contentHeight) {
                    balls[i] = resetBall();
                    return;
                }  else {
                    ctx.beginPath();
                    ctx.arc(balls[i].x , balls[i].y, 25, 0, 2 * Math.PI);
                    ctx.fillStyle = balls[i].color
                    ctx.fill();
                }
            }
        });
    }
}

function resetBall(){
    color = Math.floor(Math.random()*3);
    return {color:colors[color], x:Math.floor(Math.random()*(contentWidth  - 50) + 50), y:0}
}

function initBalls(n=2){
    let x,y
    let initBalls = []
    for(i=0;i<n;i++){
        let ball = resetBall();
        initBalls.push(ball);
    }
    return initBalls;
}
