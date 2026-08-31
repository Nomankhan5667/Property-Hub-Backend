import Message from '../models/Message.js';
import User from '../models/User.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';

/**
 * @desc    Send a secure chat message to another user
 * @route   POST /api/messages
 * @access  Protected
 */
export const sendMessage = async (req, res, next) => {
  const { receiverId, message } = req.body;

  if (!receiverId || !message) {
    return next(new ApiError('Please provide receiverId and message text', 400));
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(new ApiError('Recipient user not found', 404));
  }

  // Prevent messaging yourself
  if (receiverId === req.user._id.toString()) {
    return next(new ApiError('You cannot message yourself', 400));
  }

  const chatMessage = await Message.create({
    senderId: req.user._id,
    receiverId,
    message,
    isRead: false,
  });

  return apiResponse(res, 201, { message: chatMessage }, 'Message sent successfully');
};

/**
 * @desc    Get chat history between current user and target user
 * @route   GET /api/messages/chat/:userId
 * @access  Protected
 */
export const getChatHistory = async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user._id;

  // Find all messages between these two users
  const messages = await Message.find({
    $or: [
      { senderId: currentUserId, receiverId: targetUserId },
      { senderId: targetUserId, receiverId: currentUserId },
    ],
  }).sort({ createdAt: 1 }); // oldest first

  // Mark all unread messages from target user as read
  await Message.updateMany(
    { senderId: targetUserId, receiverId: currentUserId, isRead: false },
    { isRead: true }
  );

  return apiResponse(res, 200, { messages }, 'Chat history retrieved successfully');
};

/**
 * @desc    Get active conversation threads list for current user
 * @route   GET /api/messages/conversations
 * @access  Protected
 */
export const getConversations = async (req, res) => {
  const currentUserId = req.user._id;

  // Retrieve messages involving current user
  const messages = await Message.find({
    $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
  }).sort({ createdAt: -1 });

  // Compile unique users they chatted with
  const contactIds = new Set();
  const latestMessages = [];

  for (const msg of messages) {
    const contactId = msg.senderId.toString() === currentUserId.toString()
      ? msg.receiverId.toString()
      : msg.senderId.toString();

    if (!contactIds.has(contactId)) {
      contactIds.add(contactId);
      latestMessages.push(msg);
    }
  }

  // Populate user details for each conversation contact
  const populatedConversations = [];

  for (const msg of latestMessages) {
    const contactId = msg.senderId.toString() === currentUserId.toString()
      ? msg.receiverId
      : msg.senderId;

    const contactUser = await User.findById(contactId).select('name email avatar phone role');

    if (contactUser) {
      populatedConversations.push({
        contact: contactUser,
        lastMessage: msg,
      });
    }
  }

  return apiResponse(res, 200, { conversations: populatedConversations }, 'Conversation list retrieved successfully');
};
