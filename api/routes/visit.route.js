import express from 'express';
import {
  createVisit,
  updateVisitStatus,
  getVisitHistory,
  getPostVisits,
  getVisitRequests,
  getAllVisitRequests,
} from '../controllers/visit.controller.js';
const router = express.Router();

router.post('/', createVisit);
router.put('/:visitId', updateVisitStatus);
router.get('/post/:postId', getPostVisits);
router.get('/visit-requests', getVisitRequests);
router.get('/all-requests', getAllVisitRequests);
router.get('/history', getVisitHistory);

export default router;
