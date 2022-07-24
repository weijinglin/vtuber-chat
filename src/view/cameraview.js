import socket from "../model/socket";
import Peer from 'simple-peer'
import Dialog from "../components/Dialog";
import {useState} from 'react';

export function Cameraview(props) {

    //control the visiability of Dialog
    const [isModalVisible, setIsModalVisible] = useState(false);

    var localVideo = document.getElementById('local_video');
    var remoteVideo = document.getElementById('remote_video');
    var startButton = document.getElementById('startButton');
    var callButton = document.getElementById('callButton');
    var hangupButton = document.getElementById('hangupButton');
    var localStream;
    var client = {};
    const startAction = ()=>{
        //采集摄像头视频
        localVideo = document.getElementById('local_video');
        remoteVideo = document.getElementById('remote_video');
        startButton = document.getElementById('startButton');
        callButton = document.getElementById('callButton');
        hangupButton = document.getElementById('hangupButton');
        navigator.mediaDevices.getUserMedia({ video: true,audio:true })
            .then(function(mediaStream){
                socket.emit("NewClient");
                localStream = mediaStream;
                localVideo.srcObject = mediaStream;
                localVideo.play();
                startButton.disabled = true;
                callButton.disabled = false;


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
                    client.gotAnswer = false
                    let peer = InitPeer('init')
                    console.log("signal")
                    peer.on('signal', function (data) {
                        console.log("signal boom");
                        if (!client.gotAnswer) {
                            socket.emit('Offer', data);
                        }
                    })
                    client.peer = peer
                }

                //for peer of type not init
                function FrontAnswer(offer) {
                    let peer = InitPeer('notInit')
                    peer.on('signal', (data) => {
                        socket.emit('Answer', data)
                    })
                    peer.signal(offer)
                    client.peer = peer
                }

                function SignalAnswer(answer) {
                    client.gotAnswer = true
                    let peer = client.peer
                    peer.signal(answer)
                }

                function SessionActive() {
                    document.write('Session Active. Please come back later')
                }

                function RemovePeer() {
                    if (client.peer) {
                        client.peer.destroy();
                        hangupButton.disabled = true;
                        callButton.disabled = true;
                        startButton.disabled = false;
                    }
                }

                socket.on('BackOffer', FrontAnswer)
                socket.on('BackAnswer', SignalAnswer)
                socket.on('SessionActive', SessionActive)
                socket.on('CreatePeer', MakePeer)
                socket.on('Disconnect', RemovePeer)

            }).catch(function(error){
            console.log(JSON.stringify(error));
        });
    }

    const Response = () => {
        //采集摄像头视频
        localVideo = document.getElementById('local_video');
        remoteVideo = document.getElementById('remote_video');
        startButton = document.getElementById('startButton');
        callButton = document.getElementById('callButton');
        hangupButton = document.getElementById('hangupButton');
        navigator.mediaDevices.getUserMedia({ video: true,audio:true })
            .then(function(mediaStream){
                socket.emit("called");
                localStream = mediaStream;
                localVideo.srcObject = mediaStream;
                localVideo.play();
                startButton.disabled = true;
                callButton.disabled = false;


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
                    return peer
                }

                //for peer of type init
                function MakePeer() {
                    console.log("make peer");
                    client.gotAnswer = false
                    let peer = InitPeer('init')
                    console.log("signal")
                    peer.on('signal', function (data) {
                        console.log("signal boom");
                        if (!client.gotAnswer) {
                            socket.emit('Offer', data);
                        }
                    })
                    client.peer = peer
                }

                //for peer of type not init
                function FrontAnswer(offer) {
                    let peer = InitPeer('notInit')
                    peer.on('signal', (data) => {
                        socket.emit('Answer', data)
                    })
                    peer.signal(offer)
                    client.peer = peer
                }

                function SignalAnswer(answer) {
                    client.gotAnswer = true
                    let peer = client.peer
                    peer.signal(answer)
                }

                function SessionActive() {
                    document.write('Session Active. Please come back later')
                }

                function RemovePeer() {
                    if (client.peer) {
                        client.peer.destroy();
                        hangupButton.disabled = true;
                        callButton.disabled = true;
                        startButton.disabled = false;
                    }
                }

                socket.on('BackOffer', FrontAnswer)
                socket.on('BackAnswer', SignalAnswer)
                socket.on('SessionActive', SessionActive)
                socket.on('CreatePeer', MakePeer)
                socket.on('Disconnect', RemovePeer)

            }).catch(function(error){
            console.log(JSON.stringify(error));
        });
    }

    function response() {
        console.log("response");
        console.log(isModalVisible);
        setIsModalVisible(true);
    }

    const onOk = () => {
        console.log("ok hit");
        Response();
        setIsModalVisible(false);
    }

    const onCancel = () => {
        socket.emit("failed");
        setIsModalVisible(false);
    }

    socket.on("call",response);



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
                        <button id="startButton" onClick={startAction}>采集视频</button>
                        <button id="callButton">呼叫</button>
                        <button id="hangupButton">关闭</button>
                    </div>
            <Dialog show={isModalVisible} onok={onOk} oncancel={onCancel}></Dialog>
        </div>
    );
}