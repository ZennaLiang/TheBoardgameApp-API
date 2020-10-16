const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const { 
    createTrade,
    findUserByName,
    findUserById, 
    findAllUsers, 
    hasAuthorization,
    updateBggUsername
} = require("../controllers/trade");


const router = express.Router();
router.post("/trade/requestTrade",createTrade);
router.get("/trade/requestTrade",findUserByName);
router.get("/users", findAllUsers);
router.put("/user/bgg/:bggUsername&:userId",requireSignIn,hasAuthorization, updateBggUsername);

router.param("userId", findUserById);


module.exports = router;
