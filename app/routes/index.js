var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    currentRoom: "1",
    chatArray: ["lol", "lmao", "rofl"],
  });
});

module.exports = router;
