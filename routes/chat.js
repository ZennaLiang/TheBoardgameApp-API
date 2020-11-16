const express = require("express");

const {
  getChats,
  createChat
} = require("../controllers/chat");
const { requireSignIn } = require("../controllers/auth");
const { findUserById } = require("../controllers/user");

const router = express.Router();
router.post("/chat/start", requireSignIn, createChat);

router.get("/chat", requireSignIn, getChats);

module.exports = router;