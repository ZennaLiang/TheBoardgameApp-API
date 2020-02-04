const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const { 
    findUserById, 
    findAllUsers, 
    getUser, 
    updateUser, 
    deleteUser,
    getUserPhoto
} = require("../controllers/user");


const router = express.Router();

router.get("/users", findAllUsers);
router.get("/user/:userId", requireSignIn, getUser);
router.put("/user/:userId", requireSignIn, updateUser);
router.delete("/user/:userId", requireSignIn, deleteUser);
router.get("/user/photo/:userId", getUserPhoto);

// any route containing :userId, our app will first execute userByID()
router.param("userId", findUserById);

module.exports = router;
