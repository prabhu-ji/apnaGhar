import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { 
  createRating, 
  getPostRatings, 
  getUserVisitEligibility 
} from '../controllers/rating.controller.js';

const router = express.Router();

router.post('/', verifyToken, createRating);
router.get('/posts/:postId/ratings', getPostRatings);
router.get('/posts/:postId/rating-eligibility', verifyToken, getUserVisitEligibility);

export default router;