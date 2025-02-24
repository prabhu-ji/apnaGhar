import express from "express";
import { createVisit, updateVisitStatus } from "../controllers/visit.controller.js";

const router = express.Router();

router.post("/", createVisit);
router.put("/:visitId", updateVisitStatus);

export default router;