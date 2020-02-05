const express = require("express");

const { getPosts, createPost, postsByUser, findPostById, isPoster, deletePost, updatePost, getPostPhoto, getPost } = require("../controllers/post");
const { requireSignIn} = require("../controllers/auth");
const { createPostValidator } = require("../validator");
const { findUserById } = require("../controllers/user");

const router = express.Router();


router.get("/post/:postId", getPost);
router.get("/posts", getPosts);
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
