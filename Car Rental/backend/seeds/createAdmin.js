require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@carrental.com' });

    if (adminExists) {
      console.log('Default admin already exists.');
      process.exit(0);
    }

    // Create the admin user
    const adminUser = new User({
      fullName: 'System Admin',
      email: 'admin@carrental.com',
      phone: '+10000000000',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin'
    });

    await adminUser.save();
    console.log('Default admin created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
