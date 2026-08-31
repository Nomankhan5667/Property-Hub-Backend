import jwt from "jsonwebtoken";
import Property from '../models/Property.js';
import Favorite from '../models/Favorite.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary.service.js';
import { sendPropertyApprovalEmail } from '../services/email.service.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';

/**
 * @desc    Create a new property listing
 * @route   POST /api/properties
 * @access  Agent
 */
export const createProperty = async (req, res, next) => {
  const {
    title,
    description,
    price,
    propertyType,
    bedrooms,
    bathrooms,
    area,
    amenities,
    furnished,
    purpose,
    address,
    city,
    state,
    lat,
    lng,
  } = req.body;

  if (!title || !description || !price || !propertyType || !area || !city) {
    return next(new ApiError('Please provide all required fields', 400));
  }

  // Handle image uploads
  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        const result = await uploadToCloudinary(file.buffer, 'properties');
        images.push({
          public_id: result.public_id,
          url: result.url,
        });
      } catch (uploadErr) {
        console.error('Image upload failed:', uploadErr.message);
      }
    }
  }

  // Parse location coordinates
  const coordinates = {};
  if (lat) coordinates.lat = parseFloat(lat);
  if (lng) coordinates.lng = parseFloat(lng);

  // Parse amenities (could be array or comma-separated string)
  let parsedAmenities = [];
  if (amenities) {
    if (Array.isArray(amenities)) {
      parsedAmenities = amenities;
    } else {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      }
    }
  }

  const propertyData = {
    title,
    description,
    price: parseFloat(price),
    propertyType,
    bedrooms: parseInt(bedrooms, 10) || 0,
    bathrooms: parseInt(bathrooms, 10) || 0,
    area: parseFloat(area),
    amenities: parsedAmenities,
    furnished: furnished || 'unfurnished',
    purpose: purpose || 'sale',
    ownerId: req.user._id,
    images,
    location: {
      address: address || '',
      city,
      state: state || '',
      coordinates,
    },
    status: 'pending', // default status is pending, requires admin approval
  };

  const property = await Property.create(propertyData);

  // Notify Admins about new listing
  try {
    const admins = await User.find({ role: 'admin' });
    const notificationPromises = admins.map((admin) =>
      Notification.create({
        userId: admin._id,
        title: 'New Listing Pending Approval',
        message: `Property "${title}" by agent "${req.user.name}" requires your approval.`,
        type: 'approval',
        relatedId: property._id,
      })
    );
    await Promise.all(notificationPromises);
  } catch (err) {
    console.error('Failed to send admin notifications:', err.message);
  }

  return apiResponse(res, 201, { property }, 'Property listing submitted and pending admin approval.');
};

/**
 * @desc    Get all properties (Public search with filters, sorting, and pagination)
 * @route   GET /api/properties
 * @access  Public
 */
export const getProperties = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 9;
  const skip = (page - 1) * limit;

  // Decode token manually if authorization header is present on this public route
  if (req.headers.authorization && !req.user) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (err) {
      // Ignore token error for public queries
    }
  }

  const query = {};

  // Filters
  // 1. By default, show approved properties. Admins/agents can see all if specifically requested.
  if (req.query.myProperties === 'true' && req.user) {
    query.ownerId = req.user._id;
    if (req.query.status) query.status = req.query.status;
  } else if (req.query.status && req.user && req.user.role === 'admin') {
    query.status = req.query.status;
    if (req.query.isAvailable !== undefined) {
      query.isAvailable = req.query.isAvailable === 'true';
    }
  } else {
    // Public search only returns approved properties
    query.status = 'approved';
    query.isAvailable = true;
  }

  if (req.query.city) {
    query['location.city'] = { $regex: req.query.city, $options: 'i' };
  }

  if (req.query.propertyType && req.query.propertyType !== 'all') {
    query.propertyType = req.query.propertyType;
  }

  if (req.query.purpose && req.query.purpose !== 'all') {
    query.purpose = req.query.purpose;
  }

  if (req.query.furnished && req.query.furnished !== 'all') {
    query.furnished = req.query.furnished;
  }

  if (req.query.bedrooms && req.query.bedrooms !== 'all') {
    const beds = parseInt(req.query.bedrooms, 10);
    if (beds >= 4) {
      query.bedrooms = { $gte: 4 }; // 4+ bedrooms
    } else {
      query.bedrooms = beds;
    }
  }

  // Price Range
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
  }

  // Area Size Range
  if (req.query.minArea || req.query.maxArea) {
    query.area = {};
    if (req.query.minArea) query.area.$gte = parseFloat(req.query.minArea);
    if (req.query.maxArea) query.area.$lte = parseFloat(req.query.maxArea);
  }

  // Text Search (title, description, city, address)
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Sorting
  let sortBy = { createdAt: -1 }; // default: newest first
  if (req.query.sort) {
    if (req.query.sort === 'priceAsc') sortBy = { price: 1 };
    else if (req.query.sort === 'priceDesc') sortBy = { price: -1 };
    else if (req.query.sort === 'views') sortBy = { views: -1 };
  }

  const [properties, total] = await Promise.all([
    Property.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate('ownerId', 'name email phone avatar'),
    Property.countDocuments(query),
  ]);

  return apiResponse(res, 200, {
    properties,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  }, 'Properties retrieved successfully');
};

/**
 * @desc    Get single property details
 * @route   GET /api/properties/:id
 * @access  Public
 */
export const getProperty = async (req, res, next) => {
  const property = await Property.findById(req.params.id)
    .populate('ownerId', 'name email phone avatar role');

  if (!property) {
    return next(new ApiError('Property not found', 404));
  }

  // Increment view count
  property.views += 1;
  await property.save();

  // Check if it's favorited by user
  let isFavorited = false;
  if (req.headers.authorization) {
    // Decode token manually since this is a public route that behaves differently if authenticated
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const fav = await Favorite.findOne({ userId: decoded.id, propertyId: property._id });
      if (fav) isFavorited = true;
    } catch (err) {
      // ignore token error
    }
  }

  return apiResponse(res, 200, { property, isFavorited }, 'Property details retrieved');
};

/**
 * @desc    Update property listing
 * @route   PUT /api/properties/:id
 * @access  Agent
 */
export const updateProperty = async (req, res, next) => {
  let property = await Property.findById(req.params.id);

  if (!property) {
    return next(new ApiError('Property not found', 404));
  }

  // Verify ownership (or admin role)
  if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to edit this listing', 403));
  }

  const {
    title,
    description,
    price,
    propertyType,
    bedrooms,
    bathrooms,
    area,
    amenities,
    furnished,
    purpose,
    address,
    city,
    state,
    lat,
    lng,
    isAvailable,
    imagesToDelete, // JSON array of public_ids to remove
  } = req.body;

  const updateData = {};

  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (price) updateData.price = parseFloat(price);
  if (propertyType) updateData.propertyType = propertyType;
  if (bedrooms !== undefined) updateData.bedrooms = parseInt(bedrooms, 10);
  if (bathrooms !== undefined) updateData.bathrooms = parseInt(bathrooms, 10);
  if (area) updateData.area = parseFloat(area);
  if (furnished) updateData.furnished = furnished;
  if (purpose) updateData.purpose = purpose;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;

  // Handle location update
  updateData.location = { ...property.location };
  if (address !== undefined) updateData.location.address = address;
  if (city !== undefined) updateData.location.city = city;
  if (state !== undefined) updateData.location.state = state;
  if (lat || lng) {
    updateData.location.coordinates = {
      lat: lat ? parseFloat(lat) : property.location.coordinates?.lat,
      lng: lng ? parseFloat(lng) : property.location.coordinates?.lng,
    };
  }

  // Handle amenities update
  if (amenities) {
    if (Array.isArray(amenities)) {
      updateData.amenities = amenities;
    } else {
      try {
        updateData.amenities = JSON.parse(amenities);
      } catch (e) {
        updateData.amenities = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      }
    }
  }

  // Manage image updates
  let currentImages = [...property.images];

  // 1. Delete specified images
  if (imagesToDelete) {
    let toDelete = [];
    try {
      toDelete = JSON.parse(imagesToDelete);
    } catch (e) {
      if (typeof imagesToDelete === 'string') toDelete = [imagesToDelete];
    }

    if (Array.isArray(toDelete)) {
      for (const publicId of toDelete) {
        await deleteFromCloudinary(publicId);
        currentImages = currentImages.filter((img) => img.public_id !== publicId);
      }
    }
  }

  // 2. Upload new images
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        const result = await uploadToCloudinary(file.buffer, 'properties');
        currentImages.push({
          public_id: result.public_id,
          url: result.url,
        });
      } catch (uploadErr) {
        console.error('Image upload failed during edit:', uploadErr.message);
      }
    }
  }

  updateData.images = currentImages;

  // Whenever a property is updated, put it back to 'pending' unless edited by an Admin
  if (req.user.role !== 'admin') {
    updateData.status = 'pending';
  }

  property = await Property.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  return apiResponse(res, 200, { property }, 'Property listing updated successfully.');
};

/**
 * @desc    Delete a property listing
 * @route   DELETE /api/properties/:id
 * @access  Agent
 */
export const deleteProperty = async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new ApiError('Property not found', 404));
  }

  // Verify ownership (or admin role)
  if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to delete this listing', 403));
  }

  // Delete all images from Cloudinary
  if (property.images && property.images.length > 0) {
    for (const img of property.images) {
      await deleteFromCloudinary(img.public_id);
    }
  }

  // Delete from favorites DB
  await Favorite.deleteMany({ propertyId: property._id });

  // Delete property
  await property.deleteOne();

  return apiResponse(res, 200, null, 'Property listing deleted successfully.');
};

/**
 * @desc    Approve or Reject property listing
 * @route   PATCH /api/properties/:id/status
 * @access  Admin
 */
export const approveProperty = async (req, res, next) => {
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new ApiError('Invalid status. Must be approved or rejected.', 400));
  }

  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate('ownerId', 'name email');

  if (!property) {
    return next(new ApiError('Property not found', 404));
  }

  // Send DB notification to owner
  try {
    await Notification.create({
      userId: property.ownerId._id,
      title: `Property listing ${status}`,
      message: `Your property listing "${property.title}" has been ${status} by the admin.`,
      type: 'approval',
      relatedId: property._id,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }

  // Send email to owner
  try {
    await sendPropertyApprovalEmail(
      property.ownerId.email,
      property.ownerId.name,
      property.title,
      status
    );
  } catch (emailErr) {
    console.error('Failed to send property approval email:', emailErr.message);
  }

  return apiResponse(res, 200, { property }, `Property listing ${status} successfully.`);
};
