const express = require("express");

const { 
    getBggBoardgames, 
    getUserBggBoardgames,
    getBoardgame,
    getBGGCounts
   
} = require("../controllers/boardgame");

const { findUserById } = require("../controllers/user");

const router = express.Router();

router.get("/boardgame/user/:bggUsername", getUserBggBoardgames);
router.get("/boardgame/:bggUsername", getBggBoardgames);
router.get("/boardgame/count/:bggUsername", getBGGCounts);

module.exports = router;
