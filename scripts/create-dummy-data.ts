import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { configDotenv } from 'dotenv';
import User from '../models/User';
import Role from '../models/Roles';

// Load environment variables
configDotenv();

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URL as string);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createDummyRoles = async () => {
  console.log('🔧 Creating dummy roles...');

  const roles = [
    {
      roleName: 'Super Admin',
      permission: {
        sales: { create: true, read: true, update: true, delete: true },
        operateions: {
          voucher: { create: true, read: true, update: true, delete: true },
          content: { create: true, read: true, update: true, delete: true }
        },
        userAccess: {
          roles: { create: true, read: true, update: true, delete: true },
          user: { create: true, read: true, update: true, delete: true }
        }
      }
    },
    {
      roleName: 'Admin',
      permission: {
        sales: { create: true, read: true, update: true, delete: false },
        operateions: {
          voucher: { create: true, read: true, update: true, delete: false },
          content: { create: true, read: true, update: true, delete: false }
        },
        userAccess: {
          roles: { create: false, read: true, update: false, delete: false },
          user: { create: true, read: true, update: true, delete: false }
        }
      }
    },
    {
      roleName: 'Manager',
      permission: {
        sales: { create: true, read: true, update: true, delete: false },
        operateions: {
          voucher: { create: true, read: true, update: false, delete: false },
          content: { create: false, read: true, update: false, delete: false }
        },
        userAccess: {
          roles: { create: false, read: true, update: false, delete: false },
          user: { create: false, read: true, update: false, delete: false }
        }
      }
    },
    {
      roleName: 'Sales Agent',
      permission: {
        sales: { create: true, read: true, update: true, delete: false },
        operateions: {
          voucher: { create: false, read: true, update: false, delete: false },
          content: { create: false, read: true, update: false, delete: false }
        },
        userAccess: {
          roles: { create: false, read: false, update: false, delete: false },
          user: { create: false, read: false, update: false, delete: false }
        }
      }
    }
  ];

  const createdRoles = [];
  for (const roleData of roles) {
    try {
      // Check if role already exists
      const existingRole = await Role.findOne({ roleName: roleData.roleName });
      if (existingRole) {
        console.log(`⚠️  Role "${roleData.roleName}" already exists, skipping...`);
        createdRoles.push(existingRole);
        continue;
      }

      const role = new Role(roleData);
      const savedRole = await role.save();
      console.log(`✅ Created role: ${roleData.roleName}`);
      createdRoles.push(savedRole);
    } catch (error) {
      console.error(`❌ Error creating role ${roleData.roleName}:`, error);
    }
  }

  return createdRoles;
};

const createDummyUsers = async (roles: any[]) => {
  console.log('👥 Creating dummy users...');

  const saltRounds = 10;
  
  const users = [
    {
      name: 'Super Admin User',
      email: 'superadmin@cooncierge.com',
      mobile: '+1234567890',
      phoneCode: 1,
      password: 'SuperAdmin123!',
      superAdmin: true,
      roleName: 'Super Admin'
    },
    {
      name: 'Admin User',
      email: 'admin@cooncierge.com',
      mobile: '+1234567891',
      phoneCode: 1,
      password: 'Admin123!',
      superAdmin: false,
      roleName: 'Admin'
    },
    {
      name: 'Manager User',
      email: 'manager@cooncierge.com',
      mobile: '+1234567892',
      phoneCode: 1,
      password: 'Manager123!',
      superAdmin: false,
      roleName: 'Manager'
    },
    {
      name: 'Sales Agent',
      email: 'sales@cooncierge.com',
      mobile: '+1234567893',
      agentId: 'AGENT001',
      phoneCode: 1,
      password: 'Sales123!',
      superAdmin: false,
      roleName: 'Sales Agent'
    },
    {
      name: 'Test User',
      email: 'test@example.com',
      mobile: '+1234567894',
      phoneCode: 1,
      password: 'Test123!',
      superAdmin: false,
      roleName: 'Sales Agent'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️  User "${userData.email}" already exists, skipping...`);
        continue;
      }

      // Find the role
      const role = roles.find(r => r.roleName === userData.roleName);
      if (!role) {
        console.error(`❌ Role "${userData.roleName}" not found for user ${userData.email}`);
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user object
      const userObj = {
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        phoneCode: userData.phoneCode,
        roleId: role._id,
        superAdmin: userData.superAdmin,
        password: hashedPassword,
        ...(userData.agentId && { agentId: userData.agentId })
      };

      const user = new User(userObj);
      const savedUser = await user.save();
      console.log(`✅ Created user: ${userData.email} (Password: ${userData.password})`);
      createdUsers.push(savedUser);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }

  return createdUsers;
};

const createDummyData = async () => {
  try {
    await connectToDatabase();

    console.log('🚀 Starting dummy data creation...\n');

    // Create roles first
    const roles = await createDummyRoles();
    console.log(`\n📋 Created ${roles.length} roles\n`);

    // Create users with the created roles
    const users = await createDummyUsers(roles);
    console.log(`\n👥 Created ${users.length} users\n`);

    console.log('🎉 Dummy data creation completed!\n');
    
    console.log('📝 Login Credentials:');
    console.log('┌─────────────────────────────────┬─────────────────┬──────────────┐');
    console.log('│ Email                           │ Password        │ Role         │');
    console.log('├─────────────────────────────────┼─────────────────┼──────────────┤');
    console.log('│ superadmin@cooncierge.com       │ SuperAdmin123!  │ Super Admin  │');
    console.log('│ admin@cooncierge.com            │ Admin123!       │ Admin        │');
    console.log('│ manager@cooncierge.com          │ Manager123!     │ Manager      │');
    console.log('│ sales@cooncierge.com            │ Sales123!       │ Sales Agent  │');
    console.log('│ test@example.com                │ Test123!        │ Sales Agent  │');
    console.log('└─────────────────────────────────┴─────────────────┴──────────────┘');
    
    console.log('\n🔐 Authentication Flow:');
    console.log('1. POST /auth/login with email + password');
    console.log('2. Check your email for 2FA code');
    console.log('3. POST /auth/verify-2fa with email + 2FA code');
    console.log('4. Use the returned JWT token for authenticated requests');

  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
createDummyData();
