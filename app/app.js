var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");

var app = express();

var io = require("./io");
var chatMap = new Map();
var connectedSockets = new Set();

// Utility functions
function getCurrentRoom(socket) {
  for (let room of chatMap.values()) {
    if (room.users.has(socket)) {
      return room;
    }
  }
}

function createRoom(roomId) {
  chatMap.set(roomId, { id: roomId, users: new Set(), messages: [] });
}

function checkAndDeleteRoom(room) {
  if (room.users.size === 0) {
    chatMap.delete(room.id);
  }
}

function getSocketIds(socketSet) {
  return Array.from(socketSet).map((socket) => socket.id);
}

// Creation and removal of users from chatMap
function createUserDataInChatMap(socket, roomId) {
  let room = chatMap.get(roomId);

  if (!room) {
    createRoom(roomId);
    room = chatMap.get(roomId);
  }

  if (!room.users.has(socket)) {
    room.users.add(socket);
    socket.join(roomId);
    io.to(roomId).emit("update-users", {
      id: roomId,
      users: getSocketIds(room.users),
    });

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", { hour12: false });

    room.messages.push(
      `[System]${timeString} User ${socket.id} has joined the room`
    );
    io.to(roomId).emit("chat-message", room.messages);
  }
}

function removeUserDataFromChatMap(socket) {
  for (let room of chatMap.values()) {
    if (room.users.has(socket)) {
      room.users.delete(socket);
      io.to(room.id).emit("update-users", {
        id: room.id,
        users: getSocketIds(room.users),
      });

      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", { hour12: false });

      room.messages.push(
        `[System]${timeString} User ${socket.id} has left the room`
      );
      io.to(room.id).emit("chat-message", room.messages);

      socket.leave(room.id);
      checkAndDeleteRoom(room);
      break;
    }
  }
}

//event handlers and default room
global.defaultRoom = "default";

function addUserToDefaultRoom(socket) {
  createUserDataInChatMap(socket, defaultRoom);
}

function handleUserJoiningRoom(socket, roomId) {
  removeUserDataFromChatMap(socket);
  createUserDataInChatMap(socket, roomId);
}

function handleUserSendingMessage(socket, message) {
  const currentRoom = getCurrentRoom(socket);
  if (currentRoom) {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", { hour12: false });

    currentRoom.messages.push(`[${socket.id}]${timeString} ${message}`);
    console.log(`[${socket.id}]: ${message}`);
    console.log(" Current room messages: " + currentRoom.messages);
    io.to(currentRoom.id).emit("chat-message", currentRoom.messages);
  }
}

function handleUserDisconnecting(socket) {
  removeUserDataFromChatMap(socket);
}

function handleNewSocketConnection(socket) {
  connectedSockets.add(socket);
  addUserToDefaultRoom(socket);

  console.log(
    "A user has connected. Current connected sockets: " +
      connectedSockets.size.toString()
  );

  socket.on("disconnect", () => {
    connectedSockets.delete(socket);
    console.log(
      "A user has disconnected. Current connected sockets: " +
        connectedSockets.size.toString()
    );
    handleUserDisconnecting(socket);
  });

  socket.on("join-room", (roomId) => {
    handleUserJoiningRoom(socket, roomId);
  });

  socket.on("chat-message", (message) => {
    handleUserSendingMessage(socket, message);
  });

  console.log(connectedSockets.size);
  console.log(chatMap);
}

io.on("connection", handleNewSocketConnection);

io.on("error", (socket) => {
  console.error("error");
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
