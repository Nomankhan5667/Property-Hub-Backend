import Review from '../models/Review.js';
import Property from '../models/Property.js';
import apiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Get all reviews for a property
 * @route   GET /api/reviews/:propertyId
 * @access  Public
 */
export const getReviews = async (req, res, next) => {
  const { propertyId } = req.params;

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ApiError('Property not found', 404));
  }

  const reviews = await Review.find({ propertyId })
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 });

  return apiResponse(res, 200, { reviews }, 'Reviews retrieved successfully');
};

/**
 * @desc    Submit a review for a property
 * @route   POST /api/reviews/:propertyId
 * @access  User (Protected)
 */
export const createReview = async (req, res, next) => {
  const { propertyId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (rating === undefined || !comment) {
    return next(new ApiError('Please provide rating and comment', 400));
  }

  const rateNum = parseFloat(rating);
  if (isNaN(rateNum) || rateNum < 1 || rateNum > 5) {
    return next(new ApiError('Rating must be a number between 1 and 5', 400));
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ApiError('Property not found', 404));
  }

  // Check if user already left a review
  const existingReview = await Review.findOne({ userId, propertyId });
  if (existingReview) {
    return next(new ApiError('You have already reviewed this property. You can edit your existing review.', 400));
  }

  const review = await Review.create({
    userId,
    propertyId,
    rating: rateNum,
    comment,
  });

  const populatedReview = await review.populate('userId', 'name email avatar');

  return apiResponse(res, 201, { review: populatedReview }, 'Review submitted successfully');
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  User (Protected)
 */
export const updateReview = async (req, res, next) => {
  const { rating, comment } = req.body;

  if (rating === undefined || !comment) {
    return next(new ApiError('Please provide rating and comment', 400));
  }

  const rateNum = parseFloat(rating);
  if (isNaN(rateNum) || rateNum < 1 || rateNum > 5) {
    return next(new ApiError('Rating must be a number between 1 and 5', 400));
  }

  let review = await Review.findById(req.params.id);
  if (!review) {
    return next(new ApiError('Review not found', 404));
  }

  // Verify ownership
  if (review.userId.toString() !== req.user._id.toString()) {
    return next(new ApiError('You can only edit your own reviews', 403));
  }

  review.rating = rateNum;
  review.comment = comment;
  await review.save();

  const populatedReview = await review.populate('userId', 'name email avatar');

  return apiResponse(res, 200, { review: populatedReview }, 'Review updated successfully');
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  User (Protected)
 */
export const deleteReview = async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ApiError('Review not found', 404));
  }

  // Verify ownership or Admin role
  if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to delete this review', 403));
  }

  await review.deleteOne();

  return apiResponse(res, 200, null, 'Review deleted successfully');
};
