import express from "express";
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser,
  savePost,
  profilePosts,
  getNotificationCount, 
  verifyEmailUpdate,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/verify-email", verifyToken, verifyEmailUpdate);
router.post("/save", verifyToken, savePost);
router.get("/profilePosts", verifyToken, profilePosts);
// router.get("/notification", verifyToken, getNotifications);
router.get("/notification-count", verifyToken, getNotificationCount); 
router.get("/", getUsers);
router.get("/:id", verifyToken, getUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);

export default router;