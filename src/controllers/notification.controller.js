import Notification from '../models/Notification.js';
import apiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Get current user notifications
 * @route   GET /api/notifications
 * @access  Protected
 */
export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50); // limit to latest 50 notifications

  return apiResponse(res, 200, { notifications }, 'Notifications retrieved successfully');
};

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Protected
 */
export const markAsRead = async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ApiError('Notification not found', 404));
  }

  // Ensure notification belongs to current user
  if (notification.userId.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to access this notification', 403));
  }

  notification.isRead = true;
  await notification.save();

  return apiResponse(res, 200, { notification }, 'Notification marked as read');
};

/**
 * @desc    Mark all user's notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Protected
 */
export const markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );

  return apiResponse(res, 200, null, 'All notifications marked as read');
};
