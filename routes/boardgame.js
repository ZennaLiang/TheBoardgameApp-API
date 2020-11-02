const express = require("express");

const {
  findUserById,
  getBggBoardgames,
  getUserBggBoardgames,
  getBoardgame,
  getBGGCounts,
  getUserCollection,
  updateUserCollection
} = require("../controllers/boardgame");

const router = express.Router();

router.get("/boardgame/user/:bggUsername", getUserBggBoardgames);
router.get("/boardgame/:bggUsername", getBggBoardgames);
router.get("/boardgame/count/:bggUsername", getBGGCounts);
router.get("/boardgame/user/collection/:userId", getUserCollection);
router.post("/boardgame/user/collection/:userId/update", updateUserCollection);
// any route containing :userId, our app will first execute userByID()
router.param("userId", findUserById);
module.exports = router;
