const express = require("express");

const { 
    getBbgBoardgames, 
    getBoardgame,
    getBBGCounts
   
} = require("../controllers/boardgame");

const { findUserById } = require("../controllers/user");

const router = express.Router();


router.get("/boardgame/:bbgUsername", getBbgBoardgames);
router.get("/boardgame/count/:bbgUsername", getBBGCounts);

module.exports = router;
