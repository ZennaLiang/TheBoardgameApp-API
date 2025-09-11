import express, { Router } from "express";

import { requireSignIn } from "../controllers/auth";
import { 
    createTrade,
    getAllTrades,
    getTradeById,
    getTradesById,
    deleteTrade,
    updateTradeStatus
} from "../controllers/trade";

const router: Router = express.Router();

router.get("/trades", getAllTrades);
router.get("/trades/by/:userId", getTradesById);
router.get("/trade/by/:tradeId", getTradeById);
router.post("/trade/requestTrade", createTrade);
router.delete("/trade/delete/:tradeId", requireSignIn, deleteTrade);
router.put("/trade/update/:tradeId", requireSignIn, updateTradeStatus);

export default router;