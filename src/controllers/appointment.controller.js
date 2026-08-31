import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';

/**
 * @desc    Request a visit or video meeting appointment
 * @route   POST /api/appointments
 * @access  Protected
 */
export const createAppointment = async (req, res, next) => {
  const { dealerId, propertyId, date, time, type } = req.body;

  if (!dealerId || !date || !time) {
    return next(new ApiError('Please provide dealerId, date, and time', 400));
  }

  const dealer = await User.findById(dealerId);
  if (!dealer || dealer.role !== 'agent') {
    return next(new ApiError('Target dealer account not found', 404));
  }

  // Optional Property Check
  if (propertyId) {
    const prop = await Property.findById(propertyId);
    if (!prop) {
      return next(new ApiError('Property listing not found', 404));
    }
  }

  const appointment = await Appointment.create({
    userId: req.user._id,
    dealerId,
    propertyId: propertyId || null,
    date: new Date(date),
    time,
    type: type || 'in-person',
    status: 'pending',
  });

  // Notify dealer in DB
  try {
    await Notification.create({
      userId: dealerId,
      title: 'New Appointment Booking Request',
      message: `User "${req.user.name}" requested a ${type || 'in-person'} visit on ${new Date(date).toLocaleDateString()} at ${time}.`,
      type: 'inquiry',
      relatedId: appointment._id,
    });
  } catch (err) {
    console.error('Failed to notify dealer of appointment request:', err.message);
  }

  return apiResponse(res, 201, { appointment }, 'Appointment booking submitted successfully. Waiting for dealer approval.');
};

/**
 * @desc    Get all appointments for currently logged-in User or Dealer
 * @route   GET /api/appointments
 * @access  Protected
 */
export const getAppointments = async (req, res) => {
  const query = {};

  if (req.user.role === 'agent') {
    query.dealerId = req.user._id;
  } else if (req.user.role === 'user') {
    query.userId = req.user._id;
  } else {
    // Admins can see all
    query.$or = [{ userId: req.user._id }, { dealerId: req.user._id }];
  }

  const appointments = await Appointment.find(query)
    .populate('userId', 'name email phone avatar')
    .populate('dealerId', 'name email phone avatar')
    .populate('propertyId', 'title price location propertyType purpose')
    .sort({ date: 1, time: 1 });

  return apiResponse(res, 200, { appointments }, 'Appointments list retrieved successfully');
};

/**
 * @desc    Approve or Decline appointment request (Dealer only)
 * @route   PATCH /api/appointments/:id/status
 * @access  Protected
 */
export const updateAppointmentStatus = async (req, res, next) => {
  const { status } = req.body;

  if (!['approved', 'declined'].includes(status)) {
    return next(new ApiError("Invalid status. Must be 'approved' or 'declined'.", 400));
  }

  const appointment = await Appointment.findById(req.params.id).populate('userId', 'name');

  if (!appointment) {
    return next(new ApiError('Appointment request not found', 404));
  }

  // Verify ownership
  if (appointment.dealerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to approve/decline this appointment request', 403));
  }

  appointment.status = status;
  await appointment.save();

  // Notify client user in DB
  try {
    await Notification.create({
      userId: appointment.userId._id,
      title: `Appointment ${status}`,
      message: `Your appointment request has been ${status} by dealer "${req.user.name}".`,
      type: 'system',
      relatedId: appointment._id,
    });
  } catch (err) {
    console.error('Failed to create user appointment notification:', err.message);
  }

  return apiResponse(res, 200, { appointment }, `Appointment request has been ${status}`);
};
