import express, { Router } from "express";

import {
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
  uncommentPost,
} from "../controllers/post";
import { requireSignIn } from "../controllers/auth";
import { createPostValidator } from "../validator";
import { findUserById } from "../controllers/user";

const router: Router = express.Router();

router.get("/posts", getPosts);
router.get("/post/:postId", getPost);
router.get("/posts/by/:userId", requireSignIn, postsByUser);
// like unlike
router.put("/post/like", requireSignIn, likePost);
router.put("/post/unlike", requireSignIn, unlikePost);

// comments
router.put("/post/comment", requireSignIn, commentPost);
router.put("/post/uncomment", requireSignIn, uncommentPost);

router.post(
  "/post/new/:userId",
  requireSignIn,
  createPost,
  createPostValidator
);
router.put("/post/:postId", requireSignIn, isPoster, updatePost);
router.delete("/post/:postId", requireSignIn, isPoster, deletePost);

router.get("/post/photo/:postId", getPostPhoto);

// check if user exist when any route uses :userId in para
router.param("userId", findUserById as any);
// check if post exist when any route uses :postId in para
router.param("postId", findPostById as any);

export default router;