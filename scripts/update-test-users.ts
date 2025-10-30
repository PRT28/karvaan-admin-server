import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Business from '../models/Business';
import Role from '../models/Roles';

configDotenv();

const updateTestUsers = async () => {
  try {
    console.log('🚀 Starting user update/creation process...');
    
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
    
    // Define users to create/update
    const usersData = [
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
    
    console.log('\n👥 Processing users...');
    
    for (const userData of usersData) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          // Update existing user to associate with business
          console.log(`🔄 Updating existing user: ${userData.email}`);
          
          existingUser.businessId = userData.businessId as any;
          existingUser.userType = userData.userType;
          existingUser.roleId = userData.roleId as any;
          existingUser.name = userData.name;
          existingUser.mobile = userData.mobile;
          existingUser.phoneCode = userData.phoneCode;
          existingUser.agentId = userData.agentId;
          existingUser.isActive = true;
          
          await existingUser.save();
          console.log(`✅ Updated user: ${userData.name} (${userData.email}) - ${userData.userType}`);
          
        } else {
          // Create new user
          console.log(`➕ Creating new user: ${userData.email}`);
          
          // Hash password
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          
          const newUser = new User({
            ...userData,
            password: hashedPassword,
            isActive: true
          });
          
          await newUser.save();
          console.log(`✅ Created user: ${userData.name} (${userData.email}) - ${userData.userType}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to process user ${userData.email}:`, error);
      }
    }
    
    // Display summary
    console.log('\n📊 User Processing Summary:');
    console.log('============================');
    
    const businessUsers = await User.find({ businessId: testBusiness._id });
    console.log(`🏢 Business: ${testBusiness.businessName}`);
    console.log(`👥 Total users in business: ${businessUsers.length}`);
    
    for (const user of businessUsers) {
      const role = await Role.findById(user.roleId);
      console.log(`- ${user.name} (${user.email}) - ${user.userType} - Role: ${role?.roleName || 'Unknown'}`);
    }
    
    console.log('\n🎉 User processing completed!');
    
  } catch (error) {
    console.error('❌ User processing error:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
};

updateTestUsers();
