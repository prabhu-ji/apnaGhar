import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  addPost,
  deletePost,
  getPost,
  getPosts,
  updatePost,
  toggleSoldStatus,
  toggleRentedStatus,
  // getPageViewStats,
  // getPageViewFrequencyLabel,
  // trackPageView
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", getPosts);
router.get("/:id", getPost);
router.post("/", verifyToken, addPost);
router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);
router.patch('/:id/toggle-sold', verifyToken, toggleSoldStatus);
router.patch('/:id/toggle-rented', verifyToken, toggleRentedStatus);

// router.get("/:id/visit-count", verifyToken, getPageViewStats);
// router.get("/:id/visit-frequency", verifyToken, getPageViewFrequencyLabel);
// router.post("/:id/track-view", verifyToken, trackPageView);
export default router;