import mongoose from 'mongoose';

const dealerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      default: null,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    country: {
      type: String,
      default: 'Pakistan',
    },
    languages: [{ type: String }],
    responseTime: {
      type: String,
      default: '1 Hour',
    },
    soldPropertiesCount: {
      type: Number,
      default: 0,
    },
    rentedPropertiesCount: {
      type: Number,
      default: 0,
    },
    happyClientsCount: {
      type: Number,
      default: 0,
    },
    services: [{ type: String }],
    about: {
      type: String,
      trim: true,
    },
    cnicNumber: {
      type: String,
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      cnicVerified: { type: Boolean, default: false },
      officeVerified: { type: Boolean, default: false },
      licenseVerified: { type: Boolean, default: false },
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('DealerProfile', dealerProfileSchema);
