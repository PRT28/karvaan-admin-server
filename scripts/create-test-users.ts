import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Business from '../models/Business';
import Role from '../models/Roles';

configDotenv();

const createTestUsers = async () => {
  try {
    console.log('🚀 Starting user creation process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL as string);
    console.log('✅ Connected to MongoDB');
    
    // Find the test business
    const testBusiness = await Business.findOne({ businessName: 'Test Travel Agency 2' });
    if (!testBusiness) {
      throw new Error('Test business not found');
    }
    console.log(`🏢 Found test business: ${testBusiness.businessName} (ID: ${testBusiness._id})`);
    
    // Find roles
    const adminRole = await Role.findOne({ roleName: 'Admin' });
    const managerRole = await Role.findOne({ roleName: 'Manager' });
    const salesRole = await Role.findOne({ roleName: 'Sales Executive' });
    
    if (!adminRole || !managerRole || !salesRole) {
      throw new Error('Required roles not found');
    }
    
    console.log('📋 Found roles:');
    console.log(`- Admin: ${adminRole._id}`);
    console.log(`- Manager: ${managerRole._id}`);
    console.log(`- Sales Executive: ${salesRole._id}`);
    
    // Define users to create
    const usersToCreate = [
      {
        name: 'Yash Karvaan',
        email: 'yash@karvaanexperiences.com',
        mobile: '9876543210',
        phoneCode: 91,
        roleId: adminRole._id,
        businessId: testBusiness._id,
        userType: 'business_admin' as const,
        password: 'Yash123!',
        agentId: 'YK001'
      },
      {
        name: 'Samarth Saxena',
        email: 'samarth.saxena2002@gmail.com',
        mobile: '9876543211',
        phoneCode: 91,
        roleId: managerRole._id,
        businessId: testBusiness._id,
        userType: 'business_user' as const,
        password: 'Samarth123!',
        agentId: 'SS002'
      },
      {
        name: 'Prithviraj Tiwari',
        email: 'prithvirajtiwari28@gmail.com',
        mobile: '9876543212',
        phoneCode: 91,
        roleId: salesRole._id,
        businessId: testBusiness._id,
        userType: 'business_user' as const,
        password: 'Prithvi123!',
        agentId: 'PT003'
      }
    ];
    
    console.log('\n👥 Creating users...');
    
    for (const userData of usersToCreate) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Create user
        const newUser = new User({
          ...userData,
          password: hashedPassword,
          isActive: true
        });
        
        await newUser.save();
        console.log(`✅ Created user: ${userData.name} (${userData.email}) - ${userData.userType}`);
        
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error);
      }
    }
    
    // Display summary
    console.log('\n📊 User Creation Summary:');
    console.log('==========================');
    
    const businessUsers = await User.find({ businessId: testBusiness._id }).populate('roleId');
    console.log(`🏢 Business: ${testBusiness.businessName}`);
    console.log(`👥 Total users in business: ${businessUsers.length}`);
    
    businessUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.userType} - Role: ${(user.roleId as any).roleName}`);
    });
    
    console.log('\n🎉 User creation process completed!');
    
  } catch (error) {
    console.error('❌ User creation error:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
};

createTestUsers();
