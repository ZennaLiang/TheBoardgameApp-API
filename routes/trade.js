const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const { 
    createTrade,
    getAllTrades,
    getTradeById,
    getTradesById,
    deleteTrade,
    updateTradeStatus
} = require("../controllers/trade");

const router = express.Router();

router.get("/trades", getAllTrades);
router.get("/trades/by/:userId", getTradesById);
router.get("/trade/by/:tradeId", getTradeById);
router.post("/trade/requestTrade",createTrade);
router.delete("/trade/delete/:tradeId",  requireSignIn, deleteTrade);
router.put("/trade/update/:tradeId",requireSignIn, updateTradeStatus)



module.exports = router;
