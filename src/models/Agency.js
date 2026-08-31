import mongoose from 'mongoose';

const agencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agency name is required'],
      trim: true,
      unique: true,
    },
    logo: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
    },
    banner: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Office address is required'],
    },
    workingHours: {
      type: String,
      default: '9:00 AM - 6:00 PM',
    },
    website: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    socialLinks: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Agency', agencySchema);
