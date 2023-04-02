var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log(global.currentRoom);
  res.render("index", {
    currentRoom: global.currentRoom,
    chatArray: global.chatArray,
  });
});

module.exports = router;
