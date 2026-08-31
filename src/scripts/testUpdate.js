require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://nomigull3369798576_db_user:1yUHSgguXS0L9kmF@cluster0.jyh1zig.mongodb.net/?appName=Cluster0";

const test = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    // Find any user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found in database to test.');
      process.exit(0);
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Simulate updateProfile controller logic
    const updateData = { name: user.name + ' Updated', phone: '123456789' };
    
    console.log('Running findByIdAndUpdate...');
    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
      runValidators: true,
    });
    
    console.log('Update succeeded! New name:', updatedUser.name);
    process.exit(0);
  } catch (error) {
    console.error('Update failed with error:', error);
    process.exit(1);
  }
};

test();
