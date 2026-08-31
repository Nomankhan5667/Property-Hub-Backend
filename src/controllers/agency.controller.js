import Agency from '../models/Agency.js';
import DealerProfile from '../models/DealerProfile.js';
import Property from '../models/Property.js';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';

/**
 * @desc    Create a new real estate agency (Admin only)
 * @route   POST /api/agencies
 * @access  Admin
 */
export const createAgency = async (req, res, next) => {
  const { name, description, address, workingHours, website, email, phone, facebook, twitter, linkedin } = req.body;

  if (!name || !address) {
    return next(new ApiError('Please provide agency name and address', 400));
  }

  const existingAgency = await Agency.findOne({ name });
  if (existingAgency) {
    return next(new ApiError('An agency with this name already exists', 400));
  }

  // Handle Logo & Banner upload
  let logo = { public_id: null, url: null };
  let banner = { public_id: null, url: null };

  try {
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        const logoResult = await uploadToCloudinary(req.files.logo[0].buffer, 'agencies/logos');
        logo = { public_id: logoResult.public_id, url: logoResult.url };
      }
      if (req.files.banner && req.files.banner[0]) {
        const bannerResult = await uploadToCloudinary(req.files.banner[0].buffer, 'agencies/banners');
        banner = { public_id: bannerResult.public_id, url: bannerResult.url };
      }
    }
  } catch (err) {
    return next(new ApiError(`Media upload failed: ${err.message}. Please configure CLOUDINARY credentials in the backend .env file.`, 400));
  }

  const agency = await Agency.create({
    name,
    description,
    address,
    workingHours,
    website,
    email,
    phone,
    logo,
    banner,
    socialLinks: { facebook, twitter, linkedin },
  });

  return apiResponse(res, 201, { agency }, 'Agency created successfully');
};

/**
 * @desc    Get all agencies
 * @route   GET /api/agencies
 * @access  Public
 */
export const getAgencies = async (req, res) => {
  const agencies = await Agency.find().sort({ name: 1 });
  return apiResponse(res, 200, { agencies }, 'Agencies retrieved successfully');
};

/**
 * @desc    Get single agency details with listed agents and properties
 * @route   GET /api/agencies/:id
 * @access  Public
 */
export const getAgencyById = async (req, res, next) => {
  const agency = await Agency.findById(req.params.id);

  if (!agency) {
    return next(new ApiError('Agency not found', 404));
  }

  // Find all dealers belonging to this agency
  const dealers = await DealerProfile.find({ agencyId: req.params.id, isApproved: true, isSuspended: false })
    .populate('userId', 'name email phone avatar');

  const dealerUserIds = dealers.map((d) => d.userId?._id).filter(Boolean);

  // Find all approved listings belonging to these dealers
  const listings = await Property.find({ ownerId: { $in: dealerUserIds }, status: 'approved' })
    .sort({ createdAt: -1 });

  return apiResponse(res, 200, { agency, dealers, listings }, 'Agency details retrieved successfully');
};
