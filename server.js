const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http,{ cors: true })
const port = process.env.PORT || 8080

//设置允许跨域访问该服务.
app.all("*",function(req,res,next){
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin","*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Accept,Content-type");
    res.header("Access-Control-Allow-Credentials",true);
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type","application/json;charset=utf-8")
    if (req.method.toLowerCase() == 'options')
        res.sendStatus(200);  //让options尝试请求快速结束
    else
        next();
});

app.use(express.static(__dirname + "/public"));
app.use('/public',express.static('public'));

let clients = 0

app.get('/',function(req,res){
    res.sendFile(__dirname+'/public/index.html');
});


io.on('connection', function (socket) {
    console.log("connected!!!");
    socket.on("NewClient", function () {
        console.log("receice newclient!")
        // if (clients < 2) {
        //     if (clients == 1) {
        //         console.log("createPeer")
        //         this.emit('CreatePeer')
        //     }
        // }
        // else
        //     this.emit('SessionActive')
        // clients++;
        if(clients == 2){
            //向对端发起请求
            console.log("send req");
            this.broadcast.emit("call");
        }
        else{
            this.emit("failed")
        }
    })
    if (clients < 2) {
        if (clients == 1) {
            console.log("room fulled")
            // socket.emit('CreatePeer')
        }
        socket.join("room");
        clients++;
    }
    else
        socket.emit('SessionActive')

    socket.on('Offer', SendOffer)
    socket.on('Answer', SendAnswer)
    socket.on('disconnect', Disconnect)
    socket.on('called',Docall);
    socket.on('failed',Dofailed);
    socket.on("hangup",Dohangup);
})

function Dohangup() {
    console.log("hangup");
    this.broadcast.emit("hangup");
}

function Disconnect() {
    if (clients > 0) {
        if (clients <= 2)
            this.broadcast.emit("Disconnect")
        clients--
    }
}

function Dofailed() {
    this.broadcast.emit("failed");
}

function Docall() {
    console.log("hit");
    this.broadcast.emit("CreatePeer");
}

function SendOffer(offer) {
    console.log("offer");
    this.broadcast.emit("BackOffer", offer)
}

function SendAnswer(data) {
    this.broadcast.emit("BackAnswer", data)
}

http.listen(port, () => console.log(`Active on ${port} port`))



