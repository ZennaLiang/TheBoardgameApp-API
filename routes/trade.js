const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const { 
    createTrade,
    getAllTrades,
    getTradeById,
    getTradesById,
    deleteTrade
} = require("../controllers/trade");

const router = express.Router();

router.get("/trades", getAllTrades);
router.get("/trades/by/:userId", getTradesById);
router.get("/trade/by/:tradeId", getTradeById);
router.post("/trade/requestTrade",createTrade);
router.delete("/trade/delete/:tradeId",  requireSignIn, deleteTrade);



module.exports = router;
