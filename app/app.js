var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");

var app = express();
var io = require("./io");

let connectedSockets = new Set();
let chatMap = new Map();

function handleConnections(socket) {
  userConnection(socket);

  socket.on("disconnect", () => userDisconnection(socket));
  socket.on("join-room", (roomId) => joinRoom(roomId, socket));
  socket.on("leave-room", () => leaveRoom(socket));
  socket.on("chat-message", (message) => sendMessage(socket, message));
}

function joinRoom(roomId, socket) {
  // Remove the user from all rooms
  removeUserFromRooms(socket);

  // Add the user to the specified room
  addUserToRoom(roomId, socket);

  socket.join(roomId);
  // Emit a message to the room that the user has joined
  socket
    .to(roomId)
    .emit("chat-message", `User ${socket.id} has joined the room`);

  // Emit the updated users to the room
  const room = chatMap.get(roomId);
  updateRoomUsers(room);
}

function leaveRoom(socket) {
  // Find the room that the user is in
  let currentRoom;
  for (let room of chatMap.values()) {
    if (room.users.has(socket)) {
      currentRoom = room;
      break;
    }
  }

  // If the user is in a room, remove them
  if (currentRoom) {
    // Remove the user from the room
    currentRoom.users.delete(socket);

    socket.leave(currentRoom.id);
    // Emit a message to the room that the user has left
    socket
      .to(currentRoom.id)
      .emit("chat-message", `User ${socket.id} has left the room`);

    // Emit the updated users to the room
    updateRoomUsers(currentRoom);

    // Check if the room is empty and delete it if it is
    checkAndDeleteRoom(currentRoom);
  }
}

function userConnection(socket) {
  const defaultId = "12";
  console.log("An user has connected.");
  // Add the user to the connected sockets
  connectedSockets.add(socket);
  // Add the user to the default room
  joinRoom(defaultId, socket);
  console.log("Current connected sockets: " + connectedSockets.size.toString());

  socket.to(defaultId).emit("chat-message", "Welcome to the chat!");
}

function userDisconnection(socket) {
  console.log("An user has disconnected.");
  // Remove the user from the connected sockets
  connectedSockets.delete(socket);
  // Remove the user from all rooms
  removeUserFromRooms(socket);
  leaveRoom(socket);
  console.log("Current connected sockets: " + connectedSockets.size.toString());
}

function createRoom(roomId) {
  // Create a new room
  const room = {
    id: roomId,
    users: new Set(),
    messages: [],
  };
  // Add the room to the chatMap
  chatMap.set(roomId, room);
}

function addUserToRoom(roomId, socketId) {
  // Get the room from the chatMap
  let room = chatMap.get(roomId);

  // If the room doesn't exist, create it
  if (!room) {
    createRoom(roomId);
    room = chatMap.get(roomId);
  }
  // Check if the user is already in the room
  const userExists = room.users.has(socketId);
  // If the user doesn't exist in the room, add them
  if (!userExists) {
    room.users.add(socketId);
  }

  // Emit the updated users to the room
  updateRoomUsers(room);
}

function sendMessage(socket, message) {
  // Find the room that the user is in
  let currentRoom;
  for (let room of chatMap.values()) {
    if (room.users.has(socket)) {
      currentRoom = room;
      break;
    }
  }

  // If the user is in a room, broadcast the message
  if (currentRoom) {
    console.log(
      "Room found, sending message: " + message + " to room: " + currentRoom.id
    );
    // Add the message to the room's message history
    currentRoom.messages.push({ sender: socket.id, message });

    // Emit the message to all users in the room
    io.to(currentRoom.id).emit("chat-message", `[${socket.id}]: ${message}`);
  }
}

function removeUserFromRooms(socket) {
  // Iterate over all chat rooms and remove the user from the room
  for (let room of chatMap.values()) {
    if (room.users.has(socket)) {
      // Remove the user from the room
      room.users.delete(socket);
      // Emit the updated users to the room
      updateRoomUsers(room);
      // Check if the room is empty and delete it if it is
      checkAndDeleteRoom(room);
      break;
    }
  }
}

function checkAndDeleteRoom(room) {
  if (room.users.size === 0) {
    chatMap.delete(room.id);
  }
}

function updateRoomUsers(room) {
  io.to(room.id).emit("update-users", {
    id: room.id,
    users: Array.from(room.users).map((socket) => socket.id),
  });
}

io.on("connection", handleConnections);

io.on("error", function (socket) {
  console.log("error");
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
