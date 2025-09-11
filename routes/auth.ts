import express, { Router } from "express";

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

router.post("/signup", userSignupValidator, signUp);
router.post("/signin", signIn);
router.get("/signout", signOut);

// password forgot and reset routes
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

router.post("/google-login", googleLogin);
router.post("/facebook-login", facebookLogin);

// check if user exist when any route uses :userId in para
router.param("userId", findUserById as any);

export default router;