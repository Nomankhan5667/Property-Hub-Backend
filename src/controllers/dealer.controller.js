import DealerProfile from '../models/DealerProfile.js';
import DealerReview from '../models/DealerReview.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Report from '../models/Report.js';
import Agency from '../models/Agency.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';

/**
 * @desc    Create or update dealer profile (Agent only)
 * @route   POST /api/dealers/profile
 * @access  Agent
 */
export const upsertProfile = async (req, res, next) => {
  const {
    experience,
    city,
    languages,
    services,
    about,
    cnicNumber,
    licenseNumber,
    agencyId,
  } = req.body;

  if (!city) {
    return next(new ApiError('Please provide at least a City location', 400));
  }

  // Parse arrays
  let parsedLanguages = [];
  if (languages) {
    parsedLanguages = Array.isArray(languages) ? languages : languages.split(',').map((l) => l.trim()).filter(Boolean);
  }

  let parsedServices = [];
  if (services) {
    parsedServices = Array.isArray(services) ? services : services.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const profileData = {
    userId: req.user._id,
    experience: parseInt(experience, 10) || 0,
    city,
    languages: parsedLanguages,
    services: parsedServices,
    about: about || '',
    cnicNumber: cnicNumber || '',
    licenseNumber: licenseNumber || '',
    agencyId: agencyId || null,
  };

  let profile = await DealerProfile.findOne({ userId: req.user._id });

  if (profile) {
    // If updating, keep existing approval if CNIC/License did not change
    if (profile.cnicNumber !== cnicNumber || profile.licenseNumber !== licenseNumber) {
      profileData.isApproved = false; // requires re-approval
      profileData.verificationStatus = {
        ...profile.verificationStatus,
        cnicVerified: false,
        licenseVerified: false,
      };
    }
    profile = await DealerProfile.findOneAndUpdate(
      { userId: req.user._id },
      profileData,
      { new: true, runValidators: true }
    );
  } else {
    profile = await DealerProfile.create(profileData);
  }

  return apiResponse(res, 200, { profile }, 'Dealer profile updated successfully. Document verification may be pending.');
};

/**
 * @desc    Get all dealers (Public list with filters, sorting, and pagination)
 * @route   GET /api/dealers
 * @access  Public
 */
export const getDealers = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build match query
  const match = {
    isApproved: true,
    isSuspended: false,
  };

  // Admin filter
  if (req.query.approved === 'false' && req.user && req.user.role === 'admin') {
    match.isApproved = false;
  }

  if (req.query.city) {
    match.city = { $regex: req.query.city, $options: 'i' };
  }

  if (req.query.experience) {
    match.experience = { $gte: parseInt(req.query.experience, 10) };
  }

  if (req.query.rating) {
    match.rating = { $gte: parseFloat(req.query.rating) };
  }

  if (req.query.verified === 'true') {
    match['verificationStatus.cnicVerified'] = true;
    match['verificationStatus.licenseVerified'] = true;
  }

  // Aggregation Pipeline for Advanced Joins & Counts
  const pipeline = [
    { $match: match },
    // Join with User Collection
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    // Search Name or Email
    ...(req.query.search
      ? [
          {
            $match: {
              $or: [
                { 'user.name': { $regex: req.query.search, $options: 'i' } },
                { 'user.email': { $regex: req.query.search, $options: 'i' } },
              ],
            },
          },
        ]
      : []),
    // Join with Agency Collection
    {
      $lookup: {
        from: 'agencies',
        localField: 'agencyId',
        foreignField: '_id',
        as: 'agency',
      },
    },
    {
      $unwind: {
        path: '$agency',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Join with Properties to count listed properties
    {
      $lookup: {
        from: 'properties',
        let: { userId: '$userId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$ownerId', '$$userId'] }, status: 'approved' } },
        ],
        as: 'listings',
      },
    },
    {
      $addFields: {
        propertiesCount: { $size: '$listings' },
      },
    },
  ];

  // Sorting
  let sortField = 'createdAt';
  let sortOrder = -1;

  if (req.query.sort) {
    if (req.query.sort === 'rating') {
      sortField = 'rating';
      sortOrder = -1;
    } else if (req.query.sort === 'properties') {
      sortField = 'propertiesCount';
      sortOrder = -1;
    } else if (req.query.sort === 'reviews') {
      sortField = 'reviewsCount';
      sortOrder = -1;
    } else if (req.query.sort === 'experience') {
      sortField = 'experience';
      sortOrder = -1;
    }
  }

  pipeline.push({ $sort: { [sortField]: sortOrder } });

  // Pagination Facets
  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [{ $skip: skip }, { $limit: limit }],
    },
  });

  const aggregationResult = await DealerProfile.aggregate(pipeline);
  const total = aggregationResult[0]?.metadata[0]?.total || 0;
  const dealers = aggregationResult[0]?.data || [];

  return apiResponse(res, 200, {
    dealers,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  }, 'Dealers list retrieved successfully');
};

/**
 * @desc    Get single dealer profile details
 * @route   GET /api/dealers/:id
 * @access  Public
 */
export const getDealerById = async (req, res, next) => {
  const profile = await DealerProfile.findOne({ userId: req.params.id })
    .populate('userId', 'name email phone avatar')
    .populate('agencyId');

  if (!profile) {
    return next(new ApiError('Dealer profile not found', 404));
  }

  // Retrieve current active approved listings
  const listings = await Property.find({ ownerId: req.params.id, status: 'approved', isAvailable: true })
    .sort({ createdAt: -1 });

  // Retrieve customer reviews
  const reviews = await DealerReview.find({ dealerId: req.params.id })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 });

  return apiResponse(res, 200, { profile, listings, reviews }, 'Dealer details retrieved successfully');
};

/**
 * @desc    Verify Dealer CNIC/License credentials (Admin only)
 * @route   PATCH /api/dealers/:id/verify
 * @access  Admin
 */
export const verifyDealer = async (req, res, next) => {
  const { cnicVerified, officeVerified, licenseVerified, phoneVerified, emailVerified } = req.body;

  const profile = await DealerProfile.findOne({ userId: req.params.id });

  if (!profile) {
    return next(new ApiError('Dealer profile not found', 404));
  }

  if (cnicVerified !== undefined) profile.verificationStatus.cnicVerified = cnicVerified;
  if (officeVerified !== undefined) profile.verificationStatus.officeVerified = officeVerified;
  if (licenseVerified !== undefined) profile.verificationStatus.licenseVerified = licenseVerified;
  if (phoneVerified !== undefined) profile.verificationStatus.phoneVerified = phoneVerified;
  if (emailVerified !== undefined) profile.verificationStatus.emailVerified = emailVerified;

  await profile.save();

  return apiResponse(res, 200, { profile }, 'Dealer credentials updated successfully');
};

/**
 * @desc    Approve/Reject or Suspend Dealer Account (Admin only)
 * @route   PATCH /api/dealers/:id/status
 * @access  Admin
 */
export const updateDealerStatus = async (req, res, next) => {
  const { isApproved, isSuspended } = req.body;

  const updateData = {};
  if (isApproved !== undefined) updateData.isApproved = isApproved;
  if (isSuspended !== undefined) updateData.isSuspended = isSuspended;

  const profile = await DealerProfile.findOneAndUpdate(
    { userId: req.params.id },
    updateData,
    { new: true }
  );

  if (!profile) {
    return next(new ApiError('Dealer profile not found', 404));
  }

  return apiResponse(res, 200, { profile }, 'Dealer account status updated successfully');
};

/**
 * @desc    Report dealer for fraudulent listing or activity
 * @route   POST /api/dealers/:id/report
 * @access  Protected
 */
export const reportDealer = async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new ApiError('Please provide a reason for reporting', 400));
  }

  const reportedUser = await User.findById(req.params.id);
  if (!reportedUser) {
    return next(new ApiError('User not found', 404));
  }

  const report = await Report.create({
    reporterId: req.user._id,
    reportedUserId: req.params.id,
    reason,
  });

  return apiResponse(res, 201, { report }, 'Dealer reported successfully. Administrators will review the case.');
};

/**
 * @desc    Submit a review for a dealer
 * @route   POST /api/dealers/:id/reviews
 * @access  Protected
 */
export const submitReview = async (req, res, next) => {
  const { rating, comment } = req.body;
  const dealerId = req.params.id;

  if (!rating || !comment) {
    return next(new ApiError('Please provide a rating and comments', 400));
  }

  // Prevent reviewing yourself
  if (dealerId === req.user._id.toString()) {
    return next(new ApiError('You cannot review your own profile', 400));
  }

  const existingReview = await DealerReview.findOne({ userId: req.user._id, dealerId });
  if (existingReview) {
    return next(new ApiError('You have already left feedback for this dealer', 400));
  }

  const review = await DealerReview.create({
    userId: req.user._id,
    dealerId,
    rating: parseFloat(rating),
    comment,
  });

  // Re-calculate average rating for profile
  const reviews = await DealerReview.find({ dealerId });
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / reviews.length;

  await DealerProfile.findOneAndUpdate(
    { userId: dealerId },
    {
      rating: parseFloat(avgRating.toFixed(2)),
      reviewsCount: reviews.length,
    }
  );

  return apiResponse(res, 201, { review }, 'Review posted successfully');
};
