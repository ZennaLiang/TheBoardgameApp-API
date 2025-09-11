import express, { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  getChats,
  createChat,
  getChat,
  createMessage,
  searchUser
} from "../controllers/chat";
import { requireSignIn } from "../controllers/auth";
import { findUserById } from "../controllers/user";

const router: Router = express.Router();

// POSTS
router.post("/chat/start", requireSignIn, createChat);
router.post("/chat/search_user", requireSignIn, rateLimit({ windowMs: 30000, max: 20 }), searchUser);

// GETS
router.get("/chat/get/:id", requireSignIn, getChat);
router.get("/chat", requireSignIn, getChats);

export default router;