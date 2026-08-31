import express from "express";
import * as userController from "../controllers/user.controller.js";
import { protect, authorize } from '../middlewares/auth.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = express.Router();

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, uploadSingle, userController.updateProfile);

// Admin-only user management routes
router.get('/', protect, authorize('admin'), userController.getAllUsers);
router.patch('/:id/role', protect, authorize('admin'), userController.updateUserRole);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

export default router;
