const express = require("express");

const { 
    getPosts, 
    createPost, 
    postsByUser, 
    findPostById, 
    isPoster, 
    deletePost, 
    updatePost, 
    getPostPhoto, 
    getPost,
    likePost,
    unlikePost,
    commentPost,
    uncommentPost 
} = require("../controllers/post");
const { requireSignIn} = require("../controllers/auth");
const { createPostValidator } = require("../validator");
const { findUserById } = require("../controllers/user");

const router = express.Router();

router.get("/posts", getPosts);
router.get("/post/:postId", getPost);


// like unlike
router.put("/post/like", requireSignIn, likePost);
router.put("/post/unlike", requireSignIn, unlikePost);

// comments
router.put("/post/comment", requireSignIn, commentPost);
router.put("/post/uncomment", requireSignIn, uncommentPost);

router.post("/post/new/:userId", requireSignIn, createPost, createPostValidator);
router.get("/posts/by/:userId", requireSignIn, postsByUser);
router.put("/post/:postId", requireSignIn, isPoster, updatePost);
router.delete("/post/:postId", requireSignIn, isPoster, deletePost);

router.get("/post/photo/:postId", getPostPhoto);

// check if user exist when any route uses :userId in para
router.param("userId", findUserById);
// check if post exist when any route uses :postId in para
router.param("postId", findPostById);
module.exports = router;
