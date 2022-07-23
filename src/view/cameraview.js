

export function Cameraview(props) {

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
                        <button id="startButton">采集视频</button>
                        <button id="callButton">呼叫</button>
                        <button id="hangupButton">关闭</button>
                    </div>
                    {/*<script src="/socket.io/socket.io.js"></script>*/}
                    {/*<script src="public/bundle.js"></script>*/}
        </div>
    );
}