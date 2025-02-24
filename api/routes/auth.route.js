import express from "express";
import { login, logout, verifyOtp, register } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post('/verify-otp', verifyOtp); 
router.post("/logout", logout);

export default router;
