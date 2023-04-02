var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");

var app = express();
var io = require("./io");

let connectedSockets = new Set();

io.on("connection", function (socket) {
  console.log("An user has connected.");
  connectedSockets.add(socket);
  console.log("Current connected sockets: " + connectedSockets.size.toString());

  socket.on("disconnect", () => {
    console.log("Am user has disconnected.");
    connectedSockets.delete(socket);
    console.log(
      "Current connected sockets: " + connectedSockets.size.toString()
    );
  });

  socket.emit("chat-message", "Welcome to the chat!");
});

io.on("error", function (socket) {
  console.log("error");
});

global.chatArray = ["MOTD: Welcome to the chat!"];
global.currentRoom = 12;
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
