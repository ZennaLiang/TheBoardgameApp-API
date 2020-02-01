const express = require("express");
const { findUserById, findAllUsers, getUser, updateUser, deleteUser} = require("../controllers/user");
const { requireSignIn} = require("../controllers/auth");

const router = express.Router();

router.get("/users", findAllUsers);
router.get("/user/:userId", requireSignIn, getUser);
router.put("/user/:userId", requireSignIn, updateUser);
router.delete("/user/:userId", requireSignIn, deleteUser);

// any route containing :userId, our app will first execute userByID()
router.param("userId", findUserById);

module.exports = router;
