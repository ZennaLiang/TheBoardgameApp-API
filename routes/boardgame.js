const express = require("express");

const { 
    getBoardgames, 
    getBoardgame,
    findBgByUsername
   
} = require("../controllers/boardgame");

const { findUserById } = require("../controllers/user");

const router = express.Router();


router.get("/boardgame/:username", getBoardgames);


module.exports = router;
