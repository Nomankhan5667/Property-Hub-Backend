import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import apiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import {
  sendWelcomeEmail,
  sendForgotPasswordEmail,
} from "../services/email.service.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    return next(new ApiError("Please provide name, email, and password", 400));
  }

  if (password.length < 6) {
    return next(new ApiError("Password must be at least 6 characters", 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new ApiError("An account with this email already exists", 400));
  }

  // Only allow 'user' and 'agent' roles on public registration
  const allowedRole = ["user", "agent"].includes(role) ? role : "user";

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: allowedRole,
  });

  // Send welcome email (non-blocking)
  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (emailError) {
    console.error("Welcome email failed:", emailError.message);
  }

  const token = generateToken(user._id, user.role);

  return apiResponse(
    res,
    201,
    {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    },
    "Registration successful! Welcome to PropertyHub.",
  );
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user) {
    return next(new ApiError("Invalid email or password", 401));
  }

  if (!user.isActive) {
    return next(
      new ApiError(
        "Your account has been deactivated. Please contact support.",
        401,
      ),
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new ApiError("Invalid email or password", 401));
  }

  const token = generateToken(user._id, user.role);

  return apiResponse(
    res,
    200,
    {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    },
    "Login successful",
  );
};

/**
 * @desc    Logout user (client-side JWT invalidation)
 * @route   POST /api/auth/logout
 * @access  Protected
 */
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  return apiResponse(
    res,
    200,
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
      },
    },
    "Current user retrieved successfully",
  );
};

export const logout = async (req, res) => {
  return apiResponse(res, 200, null, "Logged out successfully");
};

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError("Please provide your email address", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if user exists - security best practice
    return apiResponse(
      res,
      200,
      null,
      "If an account with that email exists, a password reset link has been sent.",
    );
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sendForgotPasswordEmail(user.email, user.name, resetUrl);
    return apiResponse(
      res,
      200,
      null,
      "Password reset email sent successfully. Check your inbox.",
    );
  } catch (error) {
    // Clear the reset token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ApiError("Email could not be sent. Please try again later.", 500),
    );
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new ApiError("Please provide a new password", 400));
  }

  if (password.length < 6) {
    return next(new ApiError("Password must be at least 6 characters", 400));
  }

  // Hash the token from params to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ApiError(
        "Invalid or expired reset token. Please request a new password reset.",
        400,
      ),
    );
  }

  // Set new password and clear reset token fields
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const jwtToken = generateToken(user._id, user.role);

  return apiResponse(
    res,
    200,
    {
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    "Password reset successful. You are now logged in.",
  );
};
