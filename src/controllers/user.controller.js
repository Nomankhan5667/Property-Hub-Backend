import User from '../models/User.js';
import apiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { uploadToCloudinary,
  deleteFromCloudinary, } from '../services/cloudinary.service.js';

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Protected
 */
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  return apiResponse(res, 200, { user }, "Profile retrieved successfully");
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Protected
 */
export const updateProfile = async (req, res, next) => {
  const { name, phone } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;

  // Handle avatar upload
  if (req.file) {
    try {
      // Delete old avatar from Cloudinary if exists
      if (req.user.avatar && req.user.avatar.public_id) {
        await deleteFromCloudinary(req.user.avatar.public_id);
      }
      // Upload new avatar
      const uploaded = await uploadToCloudinary(req.file.buffer, "avatars");
      updateData.avatar = {
        public_id: uploaded.public_id,
        url: uploaded.url,
      };
    } catch (err) {
      console.error("Avatar upload failed:", err.message);
      // Continue updating the profile without the avatar if Cloudinary is unavailable
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  });

  return apiResponse(res, 200, { user }, "Profile updated successfully");
};

/**
 * @desc    Get all users (with pagination and role filter)
 * @route   GET /api/users
 * @access  Admin
 */
export const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined)
    filter.isActive = req.query.isActive === "true";
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return apiResponse(
    res,
    200,
    {
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    },
    "Users retrieved successfully",
  );
};

/**
 * @desc    Update user role (admin only)
 * @route   PUT /api/users/:id/role
 * @access  Admin
 */
export const updateUserRole = async (req, res, next) => {
  const { role } = req.body;

  if (!["admin", "agent", "user"].includes(role)) {
    return next(
      new ApiError("Invalid role. Must be admin, agent, or user.", 400),
    );
  }

  // Prevent admin from changing their own role
  if (req.params.id === req.user._id.toString()) {
    return next(new ApiError("You cannot change your own role", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true },
  );

  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  return apiResponse(
    res,
    200,
    { user },
    `User role updated to '${role}' successfully`,
  );
};

/**
 * @desc    Delete a user (admin only)
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
export const deleteUser = async (req, res, next) => {
  // Prevent admin from deleting themselves
  if (req.params.id === req.user._id.toString()) {
    return next(new ApiError("You cannot delete your own account", 400));
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  // Delete avatar from Cloudinary if exists
  if (user.avatar && user.avatar.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  return apiResponse(res, 200, null, "User deleted successfully");
};
