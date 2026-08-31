import Inquiry from '../models/Inquiry.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendInquiryNotificationEmail } from '../services/email.service.js';
import apiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Send a new inquiry to an agent
 * @route   POST /api/inquiries
 * @access  User (Protected)
 */
export const createInquiry = async (req, res, next) => {
  const { propertyId, message } = req.body;

  if (!propertyId || !message) {
    return next(new ApiError('Please provide propertyId and message', 400));
  }

  const property = await Property.findById(propertyId).populate('ownerId');
  if (!property) {
    return next(new ApiError('Property not found', 404));
  }

  const agent = property.ownerId;
  if (!agent) {
    return next(new ApiError('Agent not found for this property', 404));
  }

  // Prevent sending inquiries to yourself
  if (agent._id.toString() === req.user._id.toString()) {
    return next(new ApiError('You cannot send inquiries for your own property', 400));
  }

  const inquiry = await Inquiry.create({
    userId: req.user._id,
    propertyId: property._id,
    agentId: agent._id,
    message,
    status: 'pending',
  });

  // Create Notification in DB for the agent
  try {
    await Notification.create({
      userId: agent._id,
      title: 'New Property Inquiry',
      message: `You received a new inquiry from "${req.user.name}" regarding "${property.title}".`,
      type: 'inquiry',
      relatedId: inquiry._id,
    });
  } catch (err) {
    console.error('Inquiry notification DB error:', err.message);
  }

  // Send Email Notification to Agent
  try {
    await sendInquiryNotificationEmail(
      agent.email,
      agent.name,
      property.title,
      req.user.name,
      message
    );
  } catch (emailErr) {
    console.error('Inquiry email send failed:', emailErr.message);
  }

  return apiResponse(res, 201, { inquiry }, 'Inquiry sent successfully to the listing agent.');
};

/**
 * @desc    Get all inquiries for listing agent
 * @route   GET /api/inquiries
 * @access  Agent (Protected)
 */
export const getInquiries = async (req, res) => {
  const inquiries = await Inquiry.find({ agentId: req.user._id })
    .populate('userId', 'name email phone avatar')
    .populate('propertyId', 'title price location propertyType purpose status')
    .sort({ createdAt: -1 });

  return apiResponse(res, 200, { inquiries }, 'Inquiries retrieved successfully');
};

/**
 * @desc    Get sent inquiries of current user
 * @route   GET /api/inquiries/user
 * @access  User (Protected)
 */
export const getUserInquiries = async (req, res) => {
  const inquiries = await Inquiry.find({ userId: req.user._id })
    .populate('agentId', 'name email phone avatar')
    .populate('propertyId', 'title price location propertyType purpose status')
    .sort({ createdAt: -1 });

  return apiResponse(res, 200, { inquiries }, 'User inquiries retrieved successfully');
};

/**
 * @desc    Update status of an inquiry
 * @route   PATCH /api/inquiries/:id/status
 * @access  Agent (Protected)
 */
export const updateInquiryStatus = async (req, res, next) => {
  const { status } = req.body;

  if (!['pending', 'read', 'responded'].includes(status)) {
    return next(new ApiError("Invalid status. Must be 'pending', 'read', or 'responded'.", 400));
  }

  const inquiry = await Inquiry.findById(req.params.id);

  if (!inquiry) {
    return next(new ApiError('Inquiry not found', 404));
  }

  // Ensure user is the assigned agent
  if (inquiry.agentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to modify this inquiry', 403));
  }

  inquiry.status = status;
  await inquiry.save();

  return apiResponse(res, 200, { inquiry }, `Inquiry status updated to '${status}'`);
};
