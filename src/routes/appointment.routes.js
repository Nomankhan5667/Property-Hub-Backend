import express from "express";
import * as appointmentController from "../controllers/appointment.controller.js";
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect); // all appointment routes require login

router.post('/', appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

export default router;
