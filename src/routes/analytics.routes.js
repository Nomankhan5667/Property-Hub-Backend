import express from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/admin', protect, authorize('admin'), analyticsController.getAdminAnalytics);
router.get('/agent', protect, authorize('agent'), analyticsController.getAgentAnalytics);

export default router;
