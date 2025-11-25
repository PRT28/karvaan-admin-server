import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';

configDotenv();

const resetTestUserPasswords = async () => {
  try {
    console.log('🚀 Starting password reset for test users...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL as string);
    console.log('✅ Connected to MongoDB');
    
    // Define users and their new passwords
    const userPasswords = [
      { email: 'yash@karvaanexperiences.com', password: 'Yash123!' },
      { email: 'samarth.saxena2002@gmail.com', password: 'Samarth123!' },
      { email: 'prithvirajtiwari28@gmail.com', password: 'Prithvi123!' }
    ];
    
    console.log('\n🔐 Resetting passwords...');
    
    for (const userData of userPasswords) {
      try {
        const user = await User.findOne({ email: userData.email });
        
        if (user) {
          // Hash the new password
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          
          // Update the password
          user.password = hashedPassword;
          await user.save();
          
          console.log(`✅ Password reset for: ${userData.email}`);
        } else {
          console.log(`⚠️  User not found: ${userData.email}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to reset password for ${userData.email}:`, error);
      }
    }
    
    console.log('\n🎉 Password reset completed!');
    
  } catch (error) {
    console.error('❌ Password reset error:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
};

resetTestUserPasswords();
