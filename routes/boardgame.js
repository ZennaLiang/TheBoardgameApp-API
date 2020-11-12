const express = require("express");
const { requireSignIn } = require("../controllers/auth");

const {
  getBggBoardgames,
  getUserBggBoardgames,
  getBoardgame,
  getBGGCounts,
  getUserCollection,
  updateUserCollection,
} = require("../controllers/boardgame");
const { findUserById } = require("../controllers/user");

const router = express.Router();

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
module.exports = router;
