import express from "express";
import * as inquiryController from "../controllers/inquiry.controller.js";
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, inquiryController.createInquiry);
router.get('/', protect, authorize('agent', 'admin'), inquiryController.getInquiries);
router.get('/user', protect, inquiryController.getUserInquiries);
router.patch('/:id/status', protect, authorize('agent', 'admin'), inquiryController.updateInquiryStatus);

export default router;
