import express from "express";
import * as favoriteController from "../controllers/favorite.controller.js";
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/:propertyId', protect, favoriteController.toggleFavorite);
router.get('/', protect, favoriteController.getFavorites);

export default router;
