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

    var localStream;

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
    // const modelUrl = "./models/hiyori/hiyori_pro_t10.model3.json";
    // const modelUrl = "./models/haru_greeter_pro_jp/runtime/haru_greeter_t03.model3.json";
    const modelUrl = "./models/mao_pro_zh/runtime/mao_pro_t02.model3.json";
    // const modelUrl = "./models/haru_greeter_pro_jp/runtime/haru_greeter_t03.model3.json";


    var currentModel, facemesh;

    var remoteModel;

    // stand for peer connection
    const client = useRef({});

    const dc = useRef();

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

        // Add mousewheel events to scale model
        // document.querySelector("#live2d").addEventListener("wheel", (e) => {
        //     e.preventDefault();
        //     currentModel.scale.set(clamp(currentModel.scale.x + e.deltaY * -0.001, -0.5, 10));
        // });

        // add live2d model to stage
        app.stage.addChild(currentModel);

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

    useEffect( ()=>{
            const videoElement = document.querySelector(".input_video");
            // guideCanvas = document.querySelector("canvas.guides");

            console.log(videoElement);

            const app = new PIXI.Application({
                view: document.getElementById("live2d"),
                autoStart: true,
                backgroundAlpha: 0,
                backgroundColor: 0xffffff,
                resizeTo: window/1.5,
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
        //采集摄像头视频
        const remoteVideo = document.getElementById('remote_video');

                socket.emit("NewClient");
                localStream = document.getElementById("live2d").captureStream();
                console.log("debug");
                console.log(localStream);

                //used to initialize a peer
                function InitPeer(type) {
                    let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: localStream, trickle: false})
                    console.log("type " + type);
                    peer.on('stream', function (stream) {
                        // CreateVideo(stream)
                        remoteVideo.srcObject = stream;
                        remoteVideo.play();
                        remoteVideo.addEventListener("click",() => {
                            if (remoteVideo.volume != 0)
                                remoteVideo.volume = 0
                            else
                                remoteVideo.volume = 1
                        })
                    })
                    //This isn't working in chrome; works perfectly in firefox.
                    // peer.on('close', function () {
                    //     document.getElementById("peerVideo").remove();
                    //     peer.destroy()
                    // })

                    /* the next code cause some bug in the React Frame,so comment them

                    // peer.on('data', function (data) {
                    //     let decodedData = new TextDecoder('utf-8').decode(data)
                    //     let peervideo = document.querySelector('#remote_video')
                    //     peervideo.style.filter = decodedData
                    // })
                    console.log("debug")

                    */

                    return peer
                }

                //for peer of type init
                function MakePeer() {
                    console.log("make peer");
                    client.current.gotAnswer = false
                    let peer = InitPeer('init')
                    console.log("signal")
                    peer.on('signal', function (data) {
                        console.log("signal boom");
                        if (!client.current.gotAnswer) {
                            socket.emit('Offer', data);
                        }
                    })
                    client.current.peer = peer
                }

                //for peer of type not init
                function FrontAnswer(offer) {
                    let peer = InitPeer('notInit')
                    peer.on('signal', (data) => {
                        socket.emit('Answer', data)
                    })
                    peer.signal(offer)
                    client.current.peer = peer
                }

                function SignalAnswer(answer) {
                    client.current.gotAnswer = true
                    let peer = client.current.peer
                    peer.signal(answer)
                }

                function SessionActive() {
                    document.write('Session Active. Please come back later')
                }

                function RemovePeer() {
                    if (client.current.peer) {
                        client.current.peer.destroy();
                    }
                }

                function Hangup() {
                    setIsHangup(true);
                }

                socket.on('BackOffer', FrontAnswer)
                socket.on('BackAnswer', SignalAnswer)
                socket.on('SessionActive', SessionActive)
                socket.on('CreatePeer', MakePeer)
                socket.on('Disconnect', RemovePeer)
                socket.on('hangup',Hangup);
    }

    //连接的发起方进行的操作
    const Response = () => {
        //采集摄像头视频
        const remoteVideo = document.getElementById('remote_video');

        socket.emit("called");
        localStream = document.getElementById("live2d").captureStream();
        console.log("debug");
        console.log(localStream);

        //used to initialize a peer
        function InitPeer(type) {
            let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: localStream, trickle: false})
            console.log("type " + type);
            peer.on('stream', function (stream) {
                // CreateVideo(stream)
                remoteVideo.srcObject = stream;
                remoteVideo.play();
                remoteVideo.addEventListener("click",() => {
                    if (remoteVideo.volume != 0)
                        remoteVideo.volume = 0
                    else
                        remoteVideo.volume = 1
                })
            })
            //This isn't working in chrome; works perfectly in firefox.
            // peer.on('close', function () {
            //     document.getElementById("peerVideo").remove();
            //     peer.destroy()
            // })

            /* the next code cause some bug in the React Frame,so comment them

            // peer.on('data', function (data) {
            //     let decodedData = new TextDecoder('utf-8').decode(data)
            //     let peervideo = document.querySelector('#remote_video')
            //     peervideo.style.filter = decodedData
            // })
            console.log("debug")

            */

            return peer
        }

        //for peer of type init
        function MakePeer() {
            console.log("make peer");
            client.current.gotAnswer = false
            let peer = InitPeer('init')
            console.log("signal")
            peer.on('signal', function (data) {
                console.log("signal boom");
                if (!client.current.gotAnswer) {
                    socket.emit('Offer', data);
                }
            })
            client.current.peer = peer
        }

        //for peer of type not init
        function FrontAnswer(offer) {
            let peer = InitPeer('notInit')
            peer.on('signal', (data) => {
                socket.emit('Answer', data)
            })
            peer.signal(offer)
            client.current.peer = peer
        }

        function SignalAnswer(answer) {
            client.current.gotAnswer = true
            let peer = client.current.peer
            peer.signal(answer)
        }

        function SessionActive() {
            document.write('Session Active. Please come back later')
        }

        function RemovePeer() {
            if (client.current.peer) {
                client.current.peer.destroy();
            }
        }

        function Hangup() {
            setIsHangup(true);
        }

        socket.on('BackOffer', FrontAnswer)
        socket.on('BackAnswer', SignalAnswer)
        socket.on('SessionActive', SessionActive)
        socket.on('CreatePeer', MakePeer)
        socket.on('Disconnect', RemovePeer)
        socket.on('hangup',Hangup);
    }


    function response() {
        console.log("response");
        console.log(isModalVisible);
        setIsModalVisible(true);
    }

    const onOk = () => {
        console.log("ok hit");
        setIsModalVisible(false);
        Response();
        console.log("debug2");
        console.log(localStream);
    }

    const onCancel = () => {
        socket.emit("failed");
        setIsModalVisible(false);
    }

    const fail= () => {
        setIsReject(true);
    }


    const hangupAction = () => {
        console.log(localStream);
        if(localStream == null){
            // localStream = localVideo.srcObject;
            localStream = document.getElementById("live2d").captureStream();
        }
        localStream.getTracks().forEach(track => track.stop());
        console.log("in hangup");
        console.log("check peer");
        console.log(client.current.peer);
        if(client.current.peer){
            console.log("peer okk")
            client.current.peer.destroy();
            socket.emit("hangup");
        }
    }

    socket.on("call",response);
    socket.on("failed",fail);


    return (
        <div id="body">
            <div className="preview">
                <video className="input_video" width="1280px" height="720px" ></video>
            </div>
            <canvas id="live2d"></canvas>
            <video id="remote_video" autoPlay></video>
            <hr/>
            <div className="button_container">
                <button id="startButton" onClick={startAction}>呼叫</button>
                <button id="hangupButton" onClick={hangupAction}>关闭</button>
            </div>
            <Dialog show={isModalVisible} onok={onOk} oncancel={onCancel}></Dialog>
            <RejectDialog show={isReject} onok={()=>{
                setIsReject(false);
            }}></RejectDialog>
            <HangupDialog show={isHangup} onok={()=>{
                //need to add the logic of hangup
                if(localStream == null){
                    localStream = document.getElementById("live2d").captureStream();
                }
                localStream.getTracks().forEach(track => track.stop());
                if(client.current.peer){
                    console.log("peer okk")
                    client.current.peer.destroy();
                }
                setIsHangup(false);
            }}></HangupDialog>
        </div>
    );
}


