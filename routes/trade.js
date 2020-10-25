const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const { 
    createTrade,
    getAllTrades
} = require("../controllers/trade");

const router = express.Router();

router.get("/trades", getAllTrades);
router.post("/trade/requestTrade",createTrade);



module.exports = router;
