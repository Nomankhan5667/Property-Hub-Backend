import express from "express";
import * as reviewController from "../controllers/review.controller.js";
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/:propertyId', reviewController.getReviews);
router.post('/:propertyId', protect, reviewController.createReview);
router.put('/:id', protect, reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);

export default router;
