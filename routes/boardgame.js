const express = require("express");

const { 
    getBoardgames, 
    getBoardgame,
    findBgByUsername,
    getBBGCounts
   
} = require("../controllers/boardgame");

const { findUserById } = require("../controllers/user");

const router = express.Router();


router.get("/boardgame/:username", getBoardgames);
router.get("/boardgame/count/:username", getBBGCounts);

module.exports = router;
