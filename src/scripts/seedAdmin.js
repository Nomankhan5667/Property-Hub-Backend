import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const seedAdmin = async () => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;

  if (!mongoUri) {
    console.error('❌ Error: No MongoDB connection URI found in environment variables (.env).');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@propertyhub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = 'System Administrator';

    let admin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (admin) {
      admin.name = adminName;
      admin.role = 'admin';
      admin.password = adminPassword; // Triggers pre('save') bcrypt hashing
      admin.isActive = true;
      await admin.save();
      console.log(`✅ Existing admin account updated:`);
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '+1234567890',
        isActive: true,
      });
      console.log(`✅ New admin account created:`);
    }

    console.log(`=======================================`);
    console.log(` Email:    ${adminEmail}`);
    console.log(` Password: ${adminPassword}`);
    console.log(` Role:     admin`);
    console.log(`=======================================`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create/update admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
