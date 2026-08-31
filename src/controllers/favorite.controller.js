import Favorite from '../models/Favorite.js';
import Property from '../models/Property.js';
import apiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Toggle favorite status of a property (Add/Remove)
 * @route   POST /api/favorites/:propertyId
 * @access  User (Protected)
 */
export const toggleFavorite = async (req, res, next) => {
  const { propertyId } = req.params;
  const userId = req.user._id;

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ApiError('Property not found', 404));
  }

  // Check if already favorited
  const existingFav = await Favorite.findOne({ userId, propertyId });

  if (existingFav) {
    await existingFav.deleteOne();
    return apiResponse(res, 200, { isFavorited: false }, 'Property removed from favorites');
  } else {
    await Favorite.create({ userId, propertyId });
    return apiResponse(res, 200, { isFavorited: true }, 'Property added to favorites');
  }
};

/**
 * @desc    Get user's favorite properties
 * @route   GET /api/favorites
 * @access  User (Protected)
 */
export const getFavorites = async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user._id })
    .populate({
      path: 'propertyId',
      populate: { path: 'ownerId', select: 'name email phone avatar' },
    });

  // Filter out any favorites where property might have been deleted
  const properties = favorites
    .map((fav) => fav.propertyId)
    .filter((prop) => prop !== null);

  return apiResponse(res, 200, { properties }, 'Favorites retrieved successfully');
};
