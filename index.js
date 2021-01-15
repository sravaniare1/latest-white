var express = require('express')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var chatHistory = [];
var bit = 5;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/public', '/index.html'));
});

app.use(express.static('public'));

io.on('connection', function (socket) {
    console.log('New endUser Connected');
    if (chatHistory.length > bit) {
        var slicedArray = chatHistory.slice(chatHistory.length - bit, chatHistory.length);
        for (var j = 0; j < slicedArray.length; j++) {
            socket.emit("chat message from server", slicedArray[j]);
        }
    } else {
        for (var j = 0; j < chatHistory.length; j++) {
            socket.emit("chat message from server", chatHistory[j]);
        }
    }
    socket.on('chat message from client', function (data) {
        console.log('message: ' + JSON.stringify(data));
        chatHistory.push(data);
        socket.broadcast.emit("chat message from server", data);
    });

    socket.on("canvas data from client-mousedown", function (data) {
        socket.broadcast.emit("canvas data from server-mousedown", data);
    });

    socket.on("canvas data from client-mousemove", function (data) {
        socket.broadcast.emit("canvas data from server-mousemove", data);
    });

    socket.on("canvas data from client-mouseup", function (data) {
        socket.broadcast.emit("canvas data from server-mouseup", {});
    });

});

http.listen(5000, function () {
    console.log('listening on localhost:5000');
});