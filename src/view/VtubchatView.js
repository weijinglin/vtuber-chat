import "../css/style.css"
import * as PIXI from "pixi.js";
import * as Kalidokit from "kalidokit";
import '@mediapipe/holistic/holistic';
import {FaceMesh,FACEMESH_TESSELATION} from "@mediapipe/face_mesh";
import {drawConnectors,drawLandmarks} from "@mediapipe/drawing_utils";
import {Camera} from '@mediapipe/camera_utils/camera_utils';
import {useEffect,useRef,useState} from "react";
import "pixi-live2d-display"

import socket from "../model/socket";
import Peer from 'simple-peer'
import Dialog from "../components/Dialog";
import RejectDialog from "../components/RejectDialog";
import HangupDialog from "../components/HangupDialog";

// with a global PIXI variable, this plugin can automatically take
// the needed functionality from it, such as window.PIXI.Ticker
window.PIXI = PIXI;

// accordingly, here we should use require() to import the module,
// instead of the import statement because the latter will be hoisted
// over the above assignment when compiling the script
const { Live2DModel } = require('pixi-live2d-display');



export function VtubchatView(props) {

    //control the visiability of Dialog
    const [isModalVisible, setIsModalVisible] = useState(false);

    const [isReject,setIsReject] = useState(false);

    const [isHangup,setIsHangup] = useState(false);


    const videoElement = document.querySelector(".input_video");
    // var guideCanvas = document.querySelector("canvas.guides");

    // Kalidokit provides a simple easing function
    // (linear interpolation) used for animation smoothness
    // you can use a more advanced easing function if you want
    const {
        Face,
        Vector: { lerp },
        Utils: { clamp },
    } = Kalidokit;

    // Url to Live2D
    const modelUrl = "./models/hiyori/hiyori_pro_t10.model3.json";

    var currentModel, facemesh;

    var remoteModel;

    // stand for peer connection
    const client = useRef({});

    const dc = useRef();

    async function LoadRemote(modelUrl){
        // load live2d model
        // currentModel = await Live2DModel.from("https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json", { autoInteract: false });
        // currentModel = await Live2DModel.from("shizuku.model.json", { autoInteract: false });
        remoteModel = await Live2DModel.from(modelUrl, { autoInteract: false });
        remoteModel.scale.set(0.2);
        remoteModel.interactive = true;
        remoteModel.anchor.set(0.5, 0.8);
        // remoteModel.position.set(window.innerWidth * 0.5, window.innerHeight * 0.8);

        remoteModel.position.set(window.innerWidth * 0.75, window.innerHeight * 1);

        // Add events to drag model
        remoteModel.on("pointerdown", (e) => {
            remoteModel.offsetX = e.data.global.x - remoteModel.position.x;
            remoteModel.offsetY = e.data.global.y - remoteModel.position.y;
            remoteModel.dragging = true;
        });
        remoteModel.on("pointerup", (e) => {
            remoteModel.dragging = false;
        });
        remoteModel.on("pointermove", (e) => {
            if (remoteModel.dragging) {
                remoteModel.position.set(e.data.global.x - remoteModel.offsetX, e.data.global.y - remoteModel.offsetY);
            }
        });
    }

    async function LoadModel(modelUrl){
        // load live2d model
        // currentModel = await Live2DModel.from("https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json", { autoInteract: false });
        // currentModel = await Live2DModel.from("shizuku.model.json", { autoInteract: false });
        currentModel = await Live2DModel.from(modelUrl, { autoInteract: false });
        currentModel.scale.set(0.2);
        currentModel.interactive = true;
        currentModel.anchor.set(0.5, 0.8);
        // currentModel.position.set(window.innerWidth * 0.5, window.innerHeight * 0.8);

        currentModel.position.set(window.innerWidth * 0.25, window.innerHeight * 1);

        // Add events to drag model
        currentModel.on("pointerdown", (e) => {
            currentModel.offsetX = e.data.global.x - currentModel.position.x;
            currentModel.offsetY = e.data.global.y - currentModel.position.y;
            currentModel.dragging = true;
        });
        currentModel.on("pointerup", (e) => {
            currentModel.dragging = false;
        });
        currentModel.on("pointermove", (e) => {
            if (currentModel.dragging) {
                currentModel.position.set(e.data.global.x - currentModel.offsetX, e.data.global.y - currentModel.offsetY);
            }
        });
    }

    async function main(videoElement,app) {
        // create pixi application

        // guideCanvas = document.querySelector("canvas.guides");
        // startCamera();
        await LoadModel(modelUrl);
        await LoadModel(modelUrl);
        await LoadRemote(modelUrl);

        // Add mousewheel events to scale model
        // document.querySelector("#live2d").addEventListener("wheel", (e) => {
        //     e.preventDefault();
        //     currentModel.scale.set(clamp(currentModel.scale.x + e.deltaY * -0.001, -0.5, 10));
        // });

        // add live2d model to stage
        app.stage.addChild(currentModel);
        app.stage.addChild(remoteModel);

        if(!facemesh){
            // create media pipe facemesh instance
            facemesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                },
            });

            try {
                await facemesh.initialize();
            }catch (e){
                // await facemesh.initialize();
            }
        }

        // set facemesh config
        facemesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        // pass facemesh callback function
        facemesh.onResults(onResult);

        startCamera(videoElement);
    }

    const socketInit = () => {
        socket.on("try_con",data => {
            console.log("debug");
            console.log(data.offer);
            const offer = JSON.parse(data.offer);
            client.current.p2p = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302"}, // 谷歌的公共服务
                ]
            })

            client.current.p2p.onicecandidate = e => {
                console.log("New ice candidate, reprinting SDP : " + JSON.stringify(client.current.p2p.localDescription));
                const data = JSON.stringify(client.current.p2p.localDescription);
                socket.emit("answer",{answer: data})
            }

            client.current.p2p.ondatachannel = e => {
                dc.current = e.channel;
                dc.current.onmessage = e => console.log("got message from client : " + e.data);
                dc.current.onopen = e => console.log("Connection open ! ! !");
            }

            client.current.p2p.setRemoteDescription(offer).then(e => console.log("offer set done"));

            client.current.p2p.createAnswer().then(a => client.current.p2p.setLocalDescription(a)).then(a => console.log("answer created"));
        })


        socket.on("back_ans",data => {
            const answer = JSON.parse(data.answer);
            client.current.p2p.setRemoteDescription(answer);
            dc.current.send("test string");
        })
    }

    useEffect(()=>{
        socketInit();
        const videoElement = document.querySelector(".input_video");
        // guideCanvas = document.querySelector("canvas.guides");

        console.log(videoElement);

        const app = new PIXI.Application({
            view: document.getElementById("live2d"),
            autoStart: true,
            backgroundAlpha: 0,
            backgroundColor: 0xffffff,
            resizeTo: window,
        });

        main(videoElement,app);
        // setExeTime(1);



    },[]);



    const onResult = (results) => {

        animateLive2DModel(results.multiFaceLandmarks[0]);
        animateRemoteModel(results.multiFaceLandmarks[0]);
    };

    const animateRemoteModel = (points) => {
        if (!currentModel || !points) return;

        let riggedFace;

        if (points) {
            // use kalidokit face solver
            riggedFace = Face.solve(points, {
                runtime: "mediapipe",
                // video: videoElement,
            });
            rigRemoteFace(riggedFace, 0.5);
        }
    }

    const rigRemoteFace = (result, lerpAmount = 0.7) => {
        if (!remoteModel || !result) return;
        const coreModel = remoteModel.internalModel.coreModel;

        remoteModel.internalModel.motionManager.update = (...args) => {
            // disable default blink animation
            remoteModel.internalModel.eyeBlink = undefined;

            coreModel.setParameterValueById(
                "ParamEyeBallX",
                lerp(result.pupil.x, coreModel.getParameterValueById("ParamEyeBallX"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamEyeBallY",
                lerp(result.pupil.y, coreModel.getParameterValueById("ParamEyeBallY"), lerpAmount)
            );

            // X and Y axis rotations are swapped for Live2D parameters
            // because it is a 2D system and KalidoKit is a 3D system
            coreModel.setParameterValueById(
                "ParamAngleX",
                lerp(result.head.degrees.y, coreModel.getParameterValueById("ParamAngleX"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamAngleY",
                lerp(result.head.degrees.x, coreModel.getParameterValueById("ParamAngleY"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamAngleZ",
                lerp(result.head.degrees.z, coreModel.getParameterValueById("ParamAngleZ"), lerpAmount)
            );

            // update body params for models without head/body param sync
            const dampener = 0.3;
            coreModel.setParameterValueById(
                "ParamBodyAngleX",
                lerp(result.head.degrees.y * dampener, coreModel.getParameterValueById("ParamBodyAngleX"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamBodyAngleY",
                lerp(result.head.degrees.x * dampener, coreModel.getParameterValueById("ParamBodyAngleY"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamBodyAngleZ",
                lerp(result.head.degrees.z * dampener, coreModel.getParameterValueById("ParamBodyAngleZ"), lerpAmount)
            );

            // Simple example without winking.
            // Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
            let stabilizedEyes = Kalidokit.Face.stabilizeBlink(
                {
                    l: lerp(result.eye.l, coreModel.getParameterValueById("ParamEyeLOpen"), 0.7),
                    r: lerp(result.eye.r, coreModel.getParameterValueById("ParamEyeROpen"), 0.7),
                },
                result.head.y
            );
            // eye blink
            coreModel.setParameterValueById("ParamEyeLOpen", stabilizedEyes.l);
            coreModel.setParameterValueById("ParamEyeROpen", stabilizedEyes.r);

            // mouth
            coreModel.setParameterValueById(
                "ParamMouthOpenY",
                lerp(result.mouth.y, coreModel.getParameterValueById("ParamMouthOpenY"), 0.3)
            );
            // Adding 0.3 to ParamMouthForm to make default more of a "smile"
            coreModel.setParameterValueById(
                "ParamMouthForm",
                0.3 + lerp(result.mouth.x, coreModel.getParameterValueById("ParamMouthForm"), 0.3)
            );
        };
    };

    const animateLive2DModel = (points) => {
        if (!currentModel || !points) return;

        let riggedFace;

        if (points) {
            // use kalidokit face solver
            riggedFace = Face.solve(points, {
                runtime: "mediapipe",
                // video: videoElement,
            });
            rigFace(riggedFace, 0.5);
        }
    };

    // update live2d model internal state
    const rigFace = (result, lerpAmount = 0.7) => {
        if (!currentModel || !result) return;
        const coreModel = currentModel.internalModel.coreModel;

        currentModel.internalModel.motionManager.update = (...args) => {
            // disable default blink animation
            currentModel.internalModel.eyeBlink = undefined;

            coreModel.setParameterValueById(
                "ParamEyeBallX",
                lerp(result.pupil.x, coreModel.getParameterValueById("ParamEyeBallX"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamEyeBallY",
                lerp(result.pupil.y, coreModel.getParameterValueById("ParamEyeBallY"), lerpAmount)
            );

            // X and Y axis rotations are swapped for Live2D parameters
            // because it is a 2D system and KalidoKit is a 3D system
            coreModel.setParameterValueById(
                "ParamAngleX",
                lerp(result.head.degrees.y, coreModel.getParameterValueById("ParamAngleX"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamAngleY",
                lerp(result.head.degrees.x, coreModel.getParameterValueById("ParamAngleY"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamAngleZ",
                lerp(result.head.degrees.z, coreModel.getParameterValueById("ParamAngleZ"), lerpAmount)
            );

            // update body params for models without head/body param sync
            const dampener = 0.3;
            coreModel.setParameterValueById(
                "ParamBodyAngleX",
                lerp(result.head.degrees.y * dampener, coreModel.getParameterValueById("ParamBodyAngleX"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamBodyAngleY",
                lerp(result.head.degrees.x * dampener, coreModel.getParameterValueById("ParamBodyAngleY"), lerpAmount)
            );
            coreModel.setParameterValueById(
                "ParamBodyAngleZ",
                lerp(result.head.degrees.z * dampener, coreModel.getParameterValueById("ParamBodyAngleZ"), lerpAmount)
            );

            // Simple example without winking.
            // Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
            let stabilizedEyes = Kalidokit.Face.stabilizeBlink(
                {
                    l: lerp(result.eye.l, coreModel.getParameterValueById("ParamEyeLOpen"), 0.7),
                    r: lerp(result.eye.r, coreModel.getParameterValueById("ParamEyeROpen"), 0.7),
                },
                result.head.y
            );
            // eye blink
            coreModel.setParameterValueById("ParamEyeLOpen", stabilizedEyes.l);
            coreModel.setParameterValueById("ParamEyeROpen", stabilizedEyes.r);

            // mouth
            coreModel.setParameterValueById(
                "ParamMouthOpenY",
                lerp(result.mouth.y, coreModel.getParameterValueById("ParamMouthOpenY"), 0.3)
            );
            // Adding 0.3 to ParamMouthForm to make default more of a "smile"
            coreModel.setParameterValueById(
                "ParamMouthForm",
                0.3 + lerp(result.mouth.x, coreModel.getParameterValueById("ParamMouthForm"), 0.3)
            );
        };
    };


    // start camera using mediapipe camera utils
    const startCamera = (video) => {
        // sleep(1000);
        const camera = new Camera(video, {
            onFrame: async () => {
                //console.log("fix");
                //console.log(video);
                await facemesh.send({ image: video });
            },
            width: 640,
            height: 480,
        });
        if(camera.video === null){
            // window.location.reload();
            // setExeTime(0);
            // sleep(1000);
            return;
        }
        camera.start();
        // console.log("fix3");
    };

    //连接的发起方进行的操作
    const startAction = () => {
        client.current.p2p = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302"}, // 谷歌的公共服务
            ]
        });

        dc.current = client.current.p2p.createDataChannel("channel")

        dc.current.onmessage = e => console.log("got message : " + e.data)

        dc.current.onopen = e => console.log("connection open!!!");

        client.current.p2p.onicecandidate = e => {
            console.log("New ice candidate, reprinting SDP : " + JSON.stringify(client.current.p2p.localDescription));
            const data = JSON.stringify(client.current.p2p.localDescription);
            socket.emit("con_req",{ offer: data});
        }

        client.current.p2p.createOffer().then(o => client.current.p2p.setLocalDescription(o)).then(a => console.log("set successful"));
    }



    return (
        <div id="body">
            <div className="preview">
                <video className="input_video" width="1280px" height="720px" ></video>
            </div>
            <canvas id="live2d"></canvas>
            <hr/>
            <div className="button_container">
                <button id="startButton" onClick={startAction}>呼叫</button>
                <button id="hangupButton" onClick={null}>关闭</button>
            </div>
            <Dialog show={isModalVisible} onok={null} oncancel={null}></Dialog>
            <RejectDialog show={isReject} onok={()=>{
                setIsReject(false);
            }}></RejectDialog>
            <HangupDialog show={isHangup} onok={()=>{
                //need to add the logic of hangup
                setIsHangup(false);
            }}></HangupDialog>
        </div>
    );
}


