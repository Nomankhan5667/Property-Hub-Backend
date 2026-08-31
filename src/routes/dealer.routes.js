import express from "express";
import * as dealerController from "../controllers/dealer.controller.js";
import * as dealerAiController from "../controllers/dealerAi.controller.js";
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', dealerController.getDealers);
router.post('/ai/recommend', dealerAiController.getRecommendedDealers);
router.get('/ai/:id/score', dealerAiController.getDealerScore);
router.get('/:id', dealerController.getDealerById);

// Protected routes (Agents & Users)
router.post('/profile', protect, authorize('agent'), dealerController.upsertProfile);
router.post('/:id/report', protect, dealerController.reportDealer);
router.post('/:id/reviews', protect, dealerController.submitReview);

// Admin-only verification routes
router.patch('/:id/verify', protect, authorize('admin'), dealerController.verifyDealer);
router.patch('/:id/status', protect, authorize('admin'), dealerController.updateDealerStatus);

export default router;
