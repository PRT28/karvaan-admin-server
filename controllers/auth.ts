import { Request, Response } from 'express';
import User from '../models/User';
import { createToken } from '../utils/jwt';
import { isValidPermissions } from '../utils/utils';
import Role from '../models/Roles';
import cache from 'node-cache';
import bcrypt from 'bcryptjs';
import { send2FACode } from '../utils/email';

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

    // Find user by email
    console.log('Searching for user with email:', email);
    console.log('Database name:', User.db.name);
    console.log('Collection name:', User.collection.name);

    // Try to count all users first
    const totalUsers = await User.countDocuments();
    console.log('Total users in collection:', totalUsers);

    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'YES' : 'NO', user);

    if (!user) {
      res.status(404).json({ message: 'User not found with this email' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    console.log('Comparing password...');
    console.log('Input password:', password);
    console.log('Stored password hash:', user.password);
    console.log('Password hash exists:', !!user.password);
    console.log('Password hash length:', user.password ? user.password.length : 'N/A');
    console.log('Password hash type:', user.password, hashedPassword, user.password === hashedPassword);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
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

    // Find user and populate role
    const user = await User.findOne({ email }).populate('roleId');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Create JWT token
    const token = createToken(user.toObject());

    res.status(200).json({
      message: '2FA verified successfully. Login successful.',
      success: true,
      user,
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
