import express, { Router } from "express";
import { requireSignIn } from "../controllers/auth";

import {
  getBggBoardgames,
  getUserBggBoardgames,
  getBoardgame,
  getBGGCounts,
  getUserCollection,
  updateUserCollection,
} from "../controllers/boardgame";
import { findUserById } from "../controllers/user";

const router: Router = express.Router();

router.get("/boardgame/user/:bggUsername", requireSignIn, getUserBggBoardgames);
router.get("/boardgame/:bggUsername", requireSignIn, getBggBoardgames);
router.get("/boardgame/count/:bggUsername", requireSignIn, getBGGCounts);
router.get(
  "/boardgame/user/collection/:userId",
  requireSignIn,
  getUserCollection
);
router.post(
  "/boardgame/user/collection/:userId/update",
  requireSignIn,
  updateUserCollection
);
// any route containing :userId, our app will first execute userByID()
router.param("userId", findUserById);

export default router;