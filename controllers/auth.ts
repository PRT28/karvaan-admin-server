import { Request, Response } from 'express';
import User from '../models/User';
import Business from '../models/Business';
import { createToken } from '../utils/jwt';
import { isValidPermissions } from '../utils/utils';
import Role from '../models/Roles';
import cache from 'node-cache';
import bcrypt from 'bcryptjs';
import { send2FACode, sendPasswordResetNotification } from '../utils/email';
import mongoose from 'mongoose';

// Cache for storing 2FA codes with email as key
const twoFACache = new cache({ stdTTL: 300 }); // 5 minutes TTL

export const insertTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, mobile, agentId, phoneCode, roleId, superAdmin, password } = req.body;

    if (!password) {
      res.status(400).json({ message: 'Password is required' });
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      mobile,
      agentId,
      phoneCode,
      roleId,
      superAdmin,
      password: hashedPassword
    });

    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete (userResponse as any).password;

    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Register a new user under a business (Business Admin only)
export const registerBusinessUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      mobile,
      phoneCode,
      roleId,
      password,
      businessId
    } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !phoneCode || !roleId || !password || !businessId) {
      res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
      return;
    }

    // Validate business ID
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid business ID'
      });
      return;
    }

    // Check if business exists and is active
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({
        success: false,
        message: 'Business not found'
      });
      return;
    }

    if (!business.isActive) {
      res.status(400).json({
        success: false,
        message: 'Business is not active'
      });
      return;
    }

    // Check if business can add more users
    const currentUserCount = await User.countDocuments({ businessId, isActive: true });
    if (currentUserCount >= business.settings.maxUsers) {
      res.status(400).json({
        success: false,
        message: `Business has reached maximum user limit of ${business.settings.maxUsers}`
      });
      return;
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Validate role exists
    const role = await Role.findById(roleId);
    if (!role) {
      res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      mobile,
      phoneCode,
      roleId,
      businessId,
      userType: 'business_user',
      password: hashedPassword,
    });

    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete (userResponse as any).password;

    res.status(201).json({
      success: true,
      message: 'Business user registered successfully',
      user: userResponse
    });

  } catch (error: any) {
    console.error('Business user registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register business user',
      error: error.message
    });
  }
};




export const createNewRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const {roleName, permission} = req.body;

        if (roleName && roleName !== "" && isValidPermissions(permission)) {
            Role.insertOne({roleName, permission})
                .then(data => {
                    res.status(201).json({
                        message: 'role created',
                        data,
                        success: true
                    })
                })
                .catch(error => {
                    console.error(error);
                    res.status(500).json({
                        message: 'failed to create role',
                        error: error,
                        success: true
                    });
                })
        }
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message, success: false });
    }
};

export const createOrUpdateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile, email, roleId, gender, phoneCode, userId } = req.body;
    if (!mobile || !email || !roleId || !gender || !phoneCode) {
        res.status(400).json({ message: 'All fields (phoneNumber, email, roleId, gender, phoneCode) are required' });
        return;
    }
    if (userId) {
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        res.status(400).json({ message: 'User does not exists with this ID' });
        return;
      }
        existingUser.mobile = mobile;
        existingUser.email = email;
        existingUser.roleId = roleId;
        existingUser.phoneCode = phoneCode;
        existingUser.name = existingUser.name;
        existingUser.save().then(data => {
            res.status(200).json({
                message: 'User updated successfully',
                data,
                success: true,
            });
        }).catch(error => {
            console.error(error);
            res.status(500).json({
                message: 'Failed to update user',
                error: error,
                success: false,
            });
        });
    } else {
        User.insertOne({
            mobile,
            email,
            roleId,
            gender,
            phoneCode,
            }).then(data => {
            res.status(201).json({
                message: 'User created successfully',
                data,
                success: true,
            })
        }).catch(error => {
            console.error(error);
            res.status(500).json({
                message: 'Failed to create user',
                error: error,
                success: false,
            });
        });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message, success: false });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const user = await User.findById(userId).populate('roleId');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({
      message: 'User retrieved successfully',
      data: user,
      success: true,
    });
    } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message, success: false });
    }
}
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().populate('roleId');
    res.status(200).json({
      message: 'Users retrieved successfully',
      data: users,
      success: true,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message, success: false });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
        }
        res.status(200).json({
        message: 'User deleted successfully',
        success: true,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message, success: false });
    }
}

// New authentication functions for username/password with 2FA

// Login with username (email) and password
export const loginWithPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user by email with business and role information
    console.log('Searching for user with email:', email);
    console.log('Database name:', User.db.name);
    console.log('Collection name:', User.collection.name);

    // Try to count all users first
    const totalUsers = await User.countDocuments();
    console.log('Total users in collection:', totalUsers);

    const user = await User.findOne({ email, isActive: true })
      .select('+password')
      .populate('businessId', 'businessName isActive subscriptionPlan subscriptionExpiry')
      .populate('roleId', 'name permissions');
    console.log('User found:', user ? 'YES' : 'NO', user);

    if (!user) {
      res.status(404).json({ message: 'User not found with this email' });
      return;
    }

    // Check if user's business is active (for business users)
    if (user.businessId && !(user.businessId as any).isActive) {
      res.status(403).json({ message: 'Your business account is currently inactive. Please contact support.' });
      return;
    }

    // Check business subscription (for business users)
    if (user.businessId && (user.businessId as any).subscriptionExpiry) {
      const subscriptionExpiry = new Date((user.businessId as any).subscriptionExpiry);
      if (subscriptionExpiry < new Date()) {
        res.status(403).json({ message: 'Your business subscription has expired. Please renew to continue.' });
        return;
      }
    }

    const hashedPassword = await hashPassword(password);

    console.log('Comparing password...');
    console.log('Input password:', password);
    console.log('Stored password hash:', user.password);
    console.log('Password hash exists:', !!user.password);
    console.log('Password hash length:', user.password ? user.password.length : 'N/A');
    console.log('Password hash type:', user.password, hashedPassword, user.password === hashedPassword);

    // Verify password
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPasswordValid = password === user.password
    console.log('Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate 2FA code
    const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();

    // Send 2FA code via email
    const emailSent = await send2FACode(user.email, twoFACode);
    if (!emailSent) {
      res.status(500).json({ message: 'Failed to send 2FA code. Please try again.' });
      return;
    }

    // Store 2FA code in cache with email as key
    twoFACache.set(user.email, twoFACode);

    console.log(`2FA code sent to ${user.email}: ${twoFACode}`); // For debugging purposes

    res.status(200).json({
      message: '2FA code sent to your email',
      success: true,
      email: user.email, // Return email for the next step
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Verify 2FA code and create session
export const verify2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, twoFACode } = req.body;

    if (!email || !twoFACode) {
      res.status(400).json({ message: 'Email and 2FA code are required' });
      return;
    }

    // Get cached 2FA code
    const cachedCode = twoFACache.get<string>(email);
    if (!cachedCode) {
      res.status(400).json({ message: 'Invalid email or 2FA code has expired' });
      return;
    }

    console.log(`Verifying 2FA for ${email}: ${twoFACode} (cached: ${cachedCode})`); // For debugging purposes

    // Verify 2FA code
    if (cachedCode !== twoFACode) {
      res.status(400).json({ message: 'Invalid 2FA code' });
      return;
    }

    // Remove 2FA code from cache
    twoFACache.del(email);

    // Find user and populate role and business
    const user = await User.findOne({ email, isActive: true })
      .populate('roleId', 'roleName permission')
      .populate('businessId', 'businessName businessType isActive subscriptionPlan');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token with business information
    const tokenPayload = {
      ...user.toObject(),
      businessInfo: user.businessId ? {
        businessId: (user.businessId as any)._id,
        businessName: (user.businessId as any).businessName,
        businessType: (user.businessId as any).businessType,
      } : null
    };
    const token = createToken(tokenPayload);

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      message: '2FA verified successfully. Login successful.',
      success: true,
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying 2FA code', error: error.message });
  }
};

// Utility function to hash password (for manual user creation or password updates)
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Forgot password - sends notification to business admin
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    // Find the user by email
    const user = await User.findOne({ email, isActive: true })
      .populate('businessId', 'businessName adminUserId isActive')
      .populate('roleId', 'roleName');

    if (!user) {
      // For security reasons, don't reveal if email exists or not
      res.status(200).json({
        success: true,
        message: 'If the email exists in our system, a password reset notification has been sent to your business administrator.'
      });
      return;
    }

    // Check if user belongs to a business
    if (!user.businessId) {
      res.status(400).json({
        success: false,
        message: 'This user is not associated with any business. Please contact system administrator.'
      });
      return;
    }

    const business = user.businessId as any;

    // Check if business is active
    if (!business.isActive) {
      res.status(400).json({
        success: false,
        message: 'Your business account is currently inactive. Please contact support.'
      });
      return;
    }

    // Find the business admin
    const businessAdmin = await User.findById(business.adminUserId)
      .select('name email isActive');

    if (!businessAdmin || !businessAdmin.isActive) {
      res.status(500).json({
        success: false,
        message: 'Business administrator not found or inactive. Please contact system support.'
      });
      return;
    }

    // Send notification email to business admin
    const emailSent = await sendPasswordResetNotification(
      businessAdmin.email,
      businessAdmin.name,
      user.email,
      user.name,
      business.businessName
    );

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset notification. Please try again later.'
      });
      return;
    }

    console.log(`Password reset notification sent to admin ${businessAdmin.email} for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset notification has been sent to your business administrator. They will contact you shortly to assist with password recovery.',
      adminNotified: {
        adminName: businessAdmin.name,
        businessName: business.businessName
      }
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
      error: error.message
    });
  }
};
