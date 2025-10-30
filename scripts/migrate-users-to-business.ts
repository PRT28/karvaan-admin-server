import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import User from '../models/User';
import Business from '../models/Business';
import Role from '../models/Roles';
import bcrypt from 'bcryptjs';

configDotenv();

const migrateUsersToBusinessModel = async () => {
  try {
    await mongoose.connect(process.env.DB_URL as string);
    console.log('Connected to MongoDB');

    // Step 1: Update existing users to have userType field
    console.log('\n=== Step 1: Updating existing users ===');
    
    // Find all users without userType
    const usersWithoutType = await User.find({ userType: { $exists: false } });
    console.log(`Found ${usersWithoutType.length} users without userType`);

    for (const user of usersWithoutType) {
      if (user.superAdmin) {
        // Convert superAdmin users to super_admin type
        user.userType = 'super_admin';
        user.businessId = null; // Super admins don't belong to any business
        console.log(`Converting ${user.email} to super_admin`);
      } else {
        // For now, set other users as business_user (they'll need to be assigned to businesses later)
        user.userType = 'business_user';
        console.log(`Converting ${user.email} to business_user`);
      }
      
      // Set isActive to true for existing users
      user.isActive = true;
      
      await user.save();
    }

    // Step 2: Create a default business for existing non-super-admin users
    console.log('\n=== Step 2: Creating default business ===');
    
    const businessUsers = await User.find({ 
      userType: 'business_user',
      businessId: { $exists: false }
    });

    if (businessUsers.length > 0) {
      // Find or create an admin role
      let adminRole = await Role.findOne({ name: 'Admin' });
      if (!adminRole) {
        adminRole = new Role({
          name: 'Admin',
          permissions: {
            sales: { create: true, read: true, update: true, delete: true },
            operations: { create: true, read: true, update: true, delete: true },
            userAccess: { create: true, read: true, update: true, delete: true },
          }
        });
        await adminRole.save();
        console.log('Created Admin role');
      }

      // Create a default business
      const defaultBusiness = new Business({
        businessName: 'Default Business',
        businessType: 'other',
        email: 'admin@defaultbusiness.com',
        phone: '0000000000',
        address: {
          street: 'Default Street',
          city: 'Default City',
          state: 'Default State',
          country: 'Default Country',
          zipCode: '000000'
        },
        description: 'Default business created during migration',
        adminUserId: businessUsers[0]._id, // Use first user as admin
        settings: {
          allowUserRegistration: true,
          maxUsers: 50, // Allow more users for migration
          features: ['basic_features']
        }
      });

      await defaultBusiness.save();
      console.log(`Created default business: ${defaultBusiness._id}`);

      // Update the first user to be business admin
      const firstUser = businessUsers[0];
      firstUser.userType = 'business_admin';
      firstUser.businessId = defaultBusiness._id;
      firstUser.roleId = adminRole._id;
      await firstUser.save();
      console.log(`Made ${firstUser.email} the admin of default business`);

      // Assign remaining users to the default business
      for (let i = 1; i < businessUsers.length; i++) {
        const user = businessUsers[i];
        user.businessId = defaultBusiness._id;
        user.roleId = adminRole._id; // Give them admin role for now
        await user.save();
        console.log(`Assigned ${user.email} to default business`);
      }

      console.log(`Assigned ${businessUsers.length} users to default business`);
    }

    // Step 3: Add missing fields to existing users
    console.log('\n=== Step 3: Adding missing fields ===');
    
    const usersToUpdate = await User.find({
      $or: [
        { isActive: { $exists: false } },
        { lastLogin: { $exists: false } }
      ]
    });

    for (const user of usersToUpdate) {
      if (user.isActive === undefined) {
        user.isActive = true;
      }
      // lastLogin will be set on next login
      await user.save();
    }

    console.log(`Updated ${usersToUpdate.length} users with missing fields`);

    // Step 4: Display migration summary
    console.log('\n=== Migration Summary ===');
    
    const superAdmins = await User.countDocuments({ userType: 'super_admin' });
    const businessAdmins = await User.countDocuments({ userType: 'business_admin' });
    const businessUsers = await User.countDocuments({ userType: 'business_user' });
    const totalBusinesses = await Business.countDocuments();
    
    console.log(`Super Admins: ${superAdmins}`);
    console.log(`Business Admins: ${businessAdmins}`);
    console.log(`Business Users: ${businessUsers}`);
    console.log(`Total Businesses: ${totalBusinesses}`);
    
    // List all businesses
    const businesses = await Business.find().populate('adminUserId', 'name email');
    console.log('\nBusinesses:');
    businesses.forEach(business => {
      console.log(`- ${business.businessName} (${business.email}) - Admin: ${(business.adminUserId as any)?.name || 'N/A'}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the default business and update its details');
    console.log('2. Create additional businesses as needed');
    console.log('3. Reassign users to appropriate businesses');
    console.log('4. Update user roles as needed');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
if (require.main === module) {
  migrateUsersToBusinessModel();
}

export default migrateUsersToBusinessModel;
