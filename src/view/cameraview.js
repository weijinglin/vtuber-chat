import socket from "../model/socket";
import Peer from 'simple-peer'
import Dialog from "../components/Dialog";
import {useRef, useState} from 'react';
import RejectDialog from "../components/RejectDialog";
import HangupDialog from "../components/HangupDialog";
import {clear} from "@testing-library/user-event/dist/clear";

export function Cameraview(props) {

    console.log("begin");

    //control the visiability of Dialog
    const [isModalVisible, setIsModalVisible] = useState(false);

    const [isReject,setIsReject] = useState(false);

    const [isHangup,setIsHangup] = useState(false);

    const client = useRef({});

    var localVideo = document.getElementById('local_video');
    var remoteVideo = document.getElementById('remote_video');
    var startButton = document.getElementById('startButton');
    var hangupButton = document.getElementById('hangupButton');
    var localStream = null;
    // var client = {};
    const startAction = ()=>{
        //采集摄像头视频
        localVideo = document.getElementById('local_video');
        remoteVideo = document.getElementById('remote_video');
        startButton = document.getElementById('startButton');
        hangupButton = document.getElementById('hangupButton');
        navigator.mediaDevices.getUserMedia({ video: true,audio:true })
            .then(function(mediaStream){
                console.log("video");
                socket.emit("NewClient");
                console.log("debug stream");
                console.log(mediaStream);
                localStream = mediaStream;
                localVideo.srcObject = mediaStream;
                localVideo.play();
                // startButton.disabled = true;


                //used to initialize a peer
                function InitPeer(type) {
                    let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: mediaStream, trickle: false})
                    console.log("type " + type);
                    peer.on('stream', function (stream) {
                        // CreateVideo(stream)
                        console.log("in stream")
                        remoteVideo.srcObject = stream;
                        remoteVideo.play();
                        console.log("in stream finish")
                    })

                    peer.on('connect',function (){
                        console.log("connection!!!");
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
                    console.log(client.current.peer);
                    if(client.current.peer == null){
                        let peer = InitPeer('init');
                        console.log("signal")
                        peer.on('signal', function (data) {
                            console.log("signal boom");
                            if (!client.current.gotAnswer) {
                                socket.emit('Offer', data);
                            }
                            console.log("signal boom finish");
                        })
                        client.current.peer = peer
                    }
                    else{
                        return;
                    }
                }

                //for peer of type not init
                function FrontAnswer(offer) {
                    console.log(client.current.peer);
                    if(client.current.peer == null){
                        let peer = InitPeer('notInit')
                        peer.on('signal', (data) => {
                            socket.emit('Answer', data)
                        })
                        console.log("finish")
                        peer.signal(offer);
                        client.current.peer = peer
                    }
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

            }).catch(function(error){
            console.log(JSON.stringify(error));
        });
    }

    const Response = () => {
        //采集摄像头视频
        localVideo = document.getElementById('local_video');
        remoteVideo = document.getElementById('remote_video');
        startButton = document.getElementById('startButton');
        hangupButton = document.getElementById('hangupButton');
        navigator.mediaDevices.getUserMedia({ video: true,audio:true })
            .then(function(mediaStream){
                console.log("video");
                socket.emit("called");
                localStream = mediaStream;
                console.log("debug");
                console.log(localStream);
                localVideo.srcObject = mediaStream;
                localVideo.play();
                // startButton.disabled = true;


                //used to initialize a peer
                function InitPeer(type) {
                    let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: mediaStream, trickle: false})
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
                    peer.on('connect',function (){
                        console.log("connection!!!");
                    })
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
                    if(client.current.peer == null){
                        let peer = InitPeer('notInit')
                        peer.on('signal', (data) => {
                            socket.emit('Answer', data)
                        })
                        peer.signal(offer)
                        client.current.peer = peer
                    }
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
                        client.current.peer.destroy(["test"]);
                        // hangupButton.disabled = true;
                        // startButton.disabled = false;
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

            }).catch(function(error){
            console.log(JSON.stringify(error));
        });
    }

    const hangupAction = () => {
        console.log(localStream);
        if(localStream == null){
            localStream = localVideo.srcObject;
        }
        client.current.peer.removeStream(localStream);
        client.current.peer.removeAllListeners('signal');
        client.current.peer.removeAllListeners('stream');
        localStream.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject.getTracks().forEach(track=>track.stop());
        delete localVideo.srcObject;
        delete remoteVideo.srcObject;
        console.log("in hangup");
        console.log("check peer");
        console.log(client.current.peer);
        if(client.current.peer){
            console.log("peer okk")
            try {
                // client.current.peer.destroy(["test"]);
                console.log("destory");
            }
            catch (err){
                console.log("error");
                console.log(err);
            }
            delete client.current.peer;
            client.current.peer = null;
            // hangupButton.disabled = true;
            // startButton.disabled = false;
            socket.emit("hangup");
            console.log("all finish");
            socket.off('BackOffer')
            socket.off('BackAnswer')
            socket.off('SessionActive')
            socket.off('CreatePeer')
            socket.off('Disconnect')
            socket.off('hangup');
            socket.off("call",response);
            socket.off("failed",fail);
        }
    }

    function response() {
        console.log("response");
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

    // socket.on("call",response);
    socket.on("call",response);
    socket.on("failed",fail);


    return(
        <div className="container">
            <h1>单机版视频呼叫</h1>
            <hr/>
                <div className="video_container" align="center">
                    <video id="local_video" autoPlay playsInline muted></video>
                    <video id="remote_video" autoPlay></video>
                </div>
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
                if(localStream == null){
                    localStream = localVideo.srcObject;
                }
                try {
                    client.current.peer.removeStream(localStream);
                }
                catch (e) {
                    console.log(e)
                }
                client.current.peer.removeAllListeners('signal');
                client.current.peer.removeAllListeners('stream');
                localStream.getTracks().forEach(track => track.stop());
                remoteVideo.srcObject.getTracks().forEach(track=>track.stop());
                delete localVideo.srcObject;
                delete remoteVideo.srcObject;
                if(client.current.peer){
                    console.log("peer okk")
                    try {
                        // client.current.peer.destroy();
                        console.log("destory");
                    }
                    catch (err){
                        console.log("error");
                        console.log(err);
                    }
                    delete client.current.peer;
                    client.current.peer = null;
                    // hangupButton.disabled = true;
                    // startButton.disabled = false;
                    console.log("all finish");
                    socket.off('BackOffer')
                    socket.off('BackAnswer')
                    socket.off('SessionActive')
                    socket.off('CreatePeer')
                    socket.off('Disconnect')
                    socket.off('hangup');
                    socket.off("call",response);
                    socket.off("failed",fail);
                }
                setIsHangup(false);
            }}></HangupDialog>
        </div>
    );
}