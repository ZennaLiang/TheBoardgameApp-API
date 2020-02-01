const express = require("express");
const { signUp, signIn, signOut} = require("../controllers/auth");
const { findUserById } = require("../controllers/user");

const { userSignupValidator } = require("../validator");

const router = express.Router();

router.post("/signup", userSignupValidator, signUp);
router.post("/signin", signIn);
router.get("/signout", signOut);


// check if user exist when any route uses :userId in para
router.param("userId", findUserById);

module.exports = router;
 