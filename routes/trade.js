const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const { 
    createTrade
} = require("../controllers/trade");

const router = express.Router();

router.post("/trade/requestTrade",createTrade);



module.exports = router;
