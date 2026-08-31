import express from "express";
import * as aiController from "../controllers/ai.controller.js";
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/recommendations', aiController.getRecommendations);
router.post('/generate-description', protect, authorize('agent'), aiController.generateDescription);
router.post('/chat', aiController.chat);

export default router;
