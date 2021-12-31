import express from "express";
import {
  registerUser,
  sendEmailVerificationCode,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyRegisteredUser,
} from "../controllers/auth.controller.js";

const router = express.Router();

// register user
router.post("/register", registerUser);

// verify email of registered user
router.post("/verify-email", verifyRegisteredUser);

// send email verification code
router.post("/email-verification-code", sendEmailVerificationCode);

// login user
router.post("/login", loginUser);

// logout user
router.post("/logout", logoutUser);

// return user only if verified
// current-user
router.get("/current-user", getCurrentUser);

export default router;
