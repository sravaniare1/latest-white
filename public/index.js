$(document).ready(function () {
    if (localStorage.getItem("endUser") === null) {
        $('#myModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }
    var socket = io();
    var toggle = false;
    var endUser = localStorage.getItem("endUser");
    $("#chatendUser").text(endUser);
    var searchBoxText = "Type here...";
    var fixIntv;
    var fixedBoxsize = $('#fixed').outerHeight() + 'px';
    var Parent = $("#fixed"); 
    var Header = $(".fixedHeader"); 
    var textbox = $(".endUserinput"); 
    Parent.css('height', '30px');
    $("#getName").click(function () {
        localStorage.setItem("endUser", $("#name").val());
        endUser = localStorage.getItem("endUser");
        $("#chatendUser").text(endUser);
    });
    Header.click(function () {
        toggle = (!toggle) ? true : false;
        if (toggle) {
            Parent.animate({ 'height': fixedBoxsize }, 300);
        }
        else {
            Parent.animate({ 'height': '30px' }, 300);
        }
    });
    textbox.focus(function () {
        $(this).val(($(this).val() == searchBoxText) ? '' : $(this).val());
    }).blur(function () {
        $(this).val(($(this).val() == '') ? searchBoxText : $(this).val());
    }).keyup(function (a) {
        var code = (a.keyCode ? a.keyCode : a.which);
        if (code == 13 && $(this).val().trim().length > 0) {
            socket.emit("chat message from client", { endUser: endUser, msg: $(this).val() });
            $('.fixedContent').append("<div class='endUserwrap'><span class='endUser'>" + endUser + "</span><span class='messages'>" + $(this).val() + "</span><div class='endUserwrap'></div>");
            event.preventDefault();
            $(".fixedContent").scrollTop($(".fixedContent").prop("scrollHeight"));  
            $(this).val('');
        }
    });
    socket.on("chat message from server", function (data) {
        $('.fixedContent').append("<div class='endUserwrap'><span class='endUser'>" + data["endUser"] + "</span><span class='messages'>" + data["msg"] + "</span></div>");
    });
    var myCanvas = document.getElementById("myCanvas");
    var curColor = $('#selectColor option:selected').val();
    var contx = myCanvas.getContext("2d");
    contx.lineWidth = 3;
    var canvasDataWidth = 1;
    var canvasDataHeight = 1;
    var canvasIsLocked = false;
    socket.on("canvas data from server-mousedown", function (data) {
        canvasIsLocked = true;
        imgd = contx.createImageData(data["w"], data["h"]);
        imgd.data.set(data["imageDataBuffer"]);
        contx.beginPath();
        contx.moveTo(data["x"], data["y"]);
    });
    socket.on("canvas data from server-mousemove", function (data) {
        imgd = contx.createImageData(data["w"], data["h"]);
        imgd.data.set(data["imageDataBuffer"]);
        contx.lineTo(data["x"], data["y"]);
        contx.strokeStyle = data["color"];
        contx.stroke();
    });
    socket.on("canvas data from server-mouseup", function (data) {
        canvasIsLocked = false;
    });
    if (myCanvas) {
        var isDown = false;
        var canvasX, canvasY;
        $(myCanvas)
            .mousedown(function (a) {
                if (canvasIsLocked == false) {
                    isDown = true;
                    contx.beginPath();
                    canvasX = a.pageX - myCanvas.offsetLeft;
                    canvasY = a.pageY - myCanvas.offsetTop;
                    contx.moveTo(canvasX, canvasY);
                    var imgd = contx.getImageData(canvasX, canvasY, canvasDataWidth, canvasDataHeight);
                    socket.emit("canvas data from client-mousedown", {
                        imageDataBuffer: imgd.data.buffer,
                        x: canvasX,
                        y: canvasY,
                        w: canvasDataWidth,
                        h: canvasDataHeight,
                        color: curColor
                    });
                }
            })
            .mousemove(function (a) {
                if (isDown != false && canvasIsLocked == false) {
                    canvasX = a.pageX - myCanvas.offsetLeft;
                    canvasY = a.pageY - myCanvas.offsetTop;
                    contx.lineTo(canvasX, canvasY);
                    contx.strokeStyle = curColor;
                    contx.stroke();
                    var imgd = contx.getImageData(canvasX, canvasY, canvasDataWidth, canvasDataHeight);
                    socket.emit("canvas data from client-mousemove", {
                        imageDataBuffer: imgd.data.buffer,
                        x: canvasX,
                        y: canvasY,
                        w: canvasDataWidth,
                        h: canvasDataHeight,
                        color: curColor
                    });
                }
            })
            .mouseup(function (a) {
                if (canvasIsLocked == false) {
                    isDown = false;
                    contx.closePath();
                    socket.emit("canvas data from client-mouseup", {});
                }
            });
    }
    $('#selectColor').change(function () {
        curColor = $('#selectColor option:selected').val();
    }); 
    var context = myCanvas.getContext("2d");
    var mouseX = 0;
    var mouseY = 0;
    var undoList = [];
    var recentWords = [];
    function saveState() {
        undoList.push(myCanvas.toDataURL());
    }
    saveState();
    function undo() {
        undoList.pop();
        var imgData = undoList[undoList.length - 1];
        var image = new Image();
        image.src = imgData;
        image.onload = function () {
            context.clearRect(0, 0, myCanvas.width, myCanvas.height);
            context.drawImage(image, 0, 0, myCanvas.width, myCanvas.height, 0, 0, myCanvas.width, myCanvas.height);
        };
    }
    myCanvas.addEventListener("click", function (a) {
        mouseX = a.pageX - myCanvas.offsetLeft;
        mouseY = a.pageY - myCanvas.offsetTop;
        startingX = mouseX;
        recentWords = [];
        return false
    }, false);
    document.addEventListener("keydown", function (a) {
        context.font = "16px Arial";
        if (a.keyCode === 8) {
            undo();
            var recentWord = recentWords[recentWords.lenght - 1];
            mouseX -= context.measureText(recentWord).width;
            recentWords.pop();
        }
        else if (a.keyCode === 13) {
            mouseX = startingX;
            mouseY += 20;
        }
        else {
            context.fillText(a.key, mouseX, mouseY);
            mouseX += context.measureText(a.key).width;
            saveState();
            recentWords.push();
        }
    }, false);
});