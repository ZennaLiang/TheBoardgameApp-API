import express, { Router } from "express";
import rateLimit from "express-rate-limit";

import { findUserById } from "../controllers/user";
import { userSignupValidator, passwordResetValidator } from "../validator";
import {
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    googleLogin,
    facebookLogin
} from "../controllers/auth";

const router: Router = express.Router();

// Stricter rate limit for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many attempts, please try again later." }
});

router.post("/signup", authLimiter, userSignupValidator, signUp);
router.post("/signin", authLimiter, signIn);
router.get("/signout", signOut);

// password forgot and reset routes
router.put("/forgot-password", authLimiter, forgotPassword);
router.put("/reset-password", authLimiter, passwordResetValidator, resetPassword);

router.post("/google-login", authLimiter, googleLogin);
router.post("/facebook-login", authLimiter, facebookLogin);

// check if user exist when any route uses :userId in para
router.param("userId", findUserById as any);

export default router;
