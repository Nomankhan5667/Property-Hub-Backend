import express from "express";
import * as messageController from "../controllers/message.controller.js";
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect); // all chat routes require login

router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/chat/:userId', messageController.getChatHistory);

export default router;
