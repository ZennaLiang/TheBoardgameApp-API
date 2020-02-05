const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const { 
    findUserById, 
    findAllUsers, 
    getUser, 
    updateUser, 
    deleteUser,
    getUserPhoto,
    addFollowing,
    addFollower,
    removeFollowing,
    removeFollower, 
    findPeople
} = require("../controllers/user");


const router = express.Router();

// follow/unfollow must be above the rest
router.put("/user/follow", requireSignIn, addFollowing, addFollower);
router.put("/user/unfollow", requireSignIn, removeFollowing, removeFollower);

router.get("/users", findAllUsers);
router.get("/user/:userId", requireSignIn, getUser);
router.put("/user/:userId", requireSignIn, updateUser);
router.delete("/user/:userId", requireSignIn, deleteUser);
router.get("/user/photo/:userId", getUserPhoto);

router.get("/user/findpeople/:userId", requireSignIn, findPeople);

// any route containing :userId, our app will first execute userByID()
router.param("userId", findUserById);

module.exports = router;
