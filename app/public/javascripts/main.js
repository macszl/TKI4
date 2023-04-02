const socket = io();

socket.on("chat-message", function (msg) {
  console.log(msg);
});


