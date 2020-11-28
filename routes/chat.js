const express = require("express");

const {
  getChats,
  createChat,
  getChat,
  createMessage,
  searchUser
} = require("../controllers/chat");
const { requireSignIn } = require("../controllers/auth");
const { findUserById } = require("../controllers/user");

const router = express.Router();

// POSTS
router.post("/chat/start", requireSignIn, createChat);
router.post("/chat/send", requireSignIn, createMessage)
router.post("/chat/search_user", requireSignIn, searchUser)

// GETS
router.get("/chat/get/:id", requireSignIn, getChat)
router.get("/chat", requireSignIn, getChats);


module.exports = router;