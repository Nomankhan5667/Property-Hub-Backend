import express from "express";
import * as propertyController from "../controllers/property.controller.js";
import { protect, authorize } from '../middlewares/auth.js';
import { uploadImages } from '../middlewares/upload.js';

const router = express.Router();

// Public routes
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getProperty);

// Protected routes (Agent & Admin)
router.post('/', protect, authorize('agent'), uploadImages, propertyController.createProperty);
router.put('/:id', protect, authorize('agent', 'admin'), uploadImages, propertyController.updateProperty);
router.delete('/:id', protect, authorize('agent', 'admin'), propertyController.deleteProperty);

// Admin-only approval route
router.patch('/:id/status', protect, authorize('admin'), propertyController.approveProperty);

export default router;
