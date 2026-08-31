import * as aiService from '../services/ai.service.js';
import Property from '../models/Property.js';
import apiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Get AI property recommendations and find actual matching database listings
 * @route   POST /api/ai/recommendations
 * @access  Public
 */
export const getRecommendations = async (req, res, next) => {
  const { query } = req.body;

  if (!query) {
    return next(new ApiError('Please provide a search query', 400));
  }

  // Get AI recommendations analysis from Gemini
  const aiResult = await aiService.getPropertyRecommendations(query);

  // Search local database for properties matching the recommended locations or properties
  let matchingProperties = [];

  try {
    const searchConditions = [{ status: 'approved', isAvailable: true }];
    const orConditions = [];

    // Parse recommendations to construct DB search
    if (aiResult.recommendedLocations && aiResult.recommendedLocations.length > 0) {
      const cities = aiResult.recommendedLocations.map((loc) => new RegExp(loc.city.trim(), 'i'));
      orConditions.push({ 'location.city': { $in: cities } });
      orConditions.push({ 'location.address': { $in: cities } });
    }

    if (aiResult.similarProperties && aiResult.similarProperties.length > 0) {
      const types = aiResult.similarProperties
        .map((p) => p.type ? p.type.toLowerCase().trim() : '')
        .filter((t) => ['apartment', 'house', 'villa', 'office', 'shop', 'land', 'other'].includes(t));
      
      if (types.length > 0) {
        orConditions.push({ propertyType: { $in: types } });
      }
    }

    const queryObj = { status: 'approved', isAvailable: true };
    if (orConditions.length > 0) {
      queryObj.$or = orConditions;
    }

    matchingProperties = await Property.find(queryObj)
      .limit(6)
      .populate('ownerId', 'name email phone avatar');

    // If nothing found with specific filters, return the newest listings as alternatives
    if (matchingProperties.length === 0) {
      matchingProperties = await Property.find({ status: 'approved', isAvailable: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('ownerId', 'name email phone avatar');
    }
  } catch (dbErr) {
    console.error('DB query for AI recommendations failed:', dbErr.message);
  }

  return apiResponse(
    res,
    200,
    {
      aiResult,
      listings: matchingProperties,
    },
    'AI Recommendations generated successfully'
  );
};

/**
 * @desc    Generate a professional description for a property
 * @route   POST /api/ai/generate-description
 * @access  Agent (Protected)
 */
export const generateDescription = async (req, res, next) => {
  const { propertyType, bedrooms, location, area } = req.body;

  if (!propertyType || !location || !area) {
    return next(new ApiError('Please provide propertyType, location, and area', 400));
  }

  const description = await aiService.generatePropertyDescription({
    propertyType,
    bedrooms: bedrooms || 0,
    location,
    area,
  });

  return apiResponse(res, 200, { description }, 'Property description generated successfully');
};

/**
 * @desc    Chat with the AI real estate assistant
 * @route   POST /api/ai/chat
 * @access  Public
 */
export const chat = async (req, res, next) => {
  const { message, history } = req.body;

  if (!message) {
    return next(new ApiError('Please provide a message', 400));
  }

  const response = await aiService.chatWithAssistant(message, history || []);

  return apiResponse(res, 200, { response }, 'Response received');
};
