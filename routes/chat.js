const express = require("express");

const {
  getChats,
} = require("../controllers/chat");
const { requireSignIn } = require("../controllers/auth");
const { createPostValidator } = require("../validator");
const { findUserById } = require("../controllers/user");

const router = express.Router();

router.get("/chat", (req, res)=>{
    res.send("hi")
});


module.exports = router;