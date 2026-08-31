import express from "express";
import * as agencyController from "../controllers/agency.controller.js";
import { protect, authorize } from '../middlewares/auth.js';
import multer from "multer";

// Configure local multer memory storage for logo and banner fields
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
});
const uploadAgencyMedia = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
]);

const router = express.Router();

router.get('/', agencyController.getAgencies);
router.get('/:id', agencyController.getAgencyById);

// Admin-only agency creation
router.post('/', protect, authorize('admin'), uploadAgencyMedia, agencyController.createAgency);

export default router;
