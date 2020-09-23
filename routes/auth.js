const express = require("express");
const router = express.Router();

const { findUserById } = require("../controllers/user");
const { userSignupValidator, passwordResetValidator } = require("../validator");
const { 
    signUp, 
    signIn, 
    signOut,
    forgotPassword,
    resetPassword,
    googleLogin,
    facebookLogin
} = require("../controllers/auth");

router.post("/signup", userSignupValidator, signUp);
router.post("/signin", signIn);
router.get("/signout", signOut);

// password forgot and reset routes
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

router.post("/google-login", googleLogin);
router.post("/facebook-login", facebookLogin);

// check if user exist when any route uses :userId in para
router.param("userId", findUserById);
  //
module.exports = router;
 