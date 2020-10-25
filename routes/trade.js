const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const { 
    createTrade,
    getAllTrades,
    getTradesById
} = require("../controllers/trade");

const router = express.Router();

router.get("/trades", getAllTrades);
router.get("/trades/by/:userId", getTradesById);
router.post("/trade/requestTrade",createTrade);



module.exports = router;
