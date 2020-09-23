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
    findPeople,
    hasAuthorization,
    updateBggUsername
} = require("../controllers/user");


const router = express.Router();

router.get("/users", findAllUsers);
router.put("/user/bgg/:bggUsername&:userId",requireSignIn,hasAuthorization, updateBggUsername);
// follow/unfollow must be above the rest
router.put("/user/follow", requireSignIn, addFollowing, addFollower);
router.put("/user/unfollow", requireSignIn, removeFollowing, removeFollower);

router.get("/user/:userId", requireSignIn, getUser);
router.put("/user/:userId", requireSignIn, hasAuthorization, updateUser);

router.delete("/user/:userId", requireSignIn, hasAuthorization, deleteUser);
router.get("/user/photo/:userId", getUserPhoto);

router.get("/user/findpeople/:userId", requireSignIn, findPeople);

// any route containing :userId, our app will first execute userByID()
router.param("userId", findUserById);

module.exports = router;
