import axios from 'axios';
import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { createToken } from '../utils/jwt';
import { isValidPermissions } from '../utils/utils';
import Role from '../models/Roles';
import twilio from '../utils/twilio';
import cache from 'node-cache';

const otpCache = new cache({ stdTTL: 300 }); // 5 minutes TTL

export const sendOtpSU = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }
    const user = await User.findOne({ mobile: phoneNumber });
    if (!user) {
      res.status(404).json({ message: 'User not found with this Phone number' });
      return;
    } else if (user.superAdmin === false) {
      res.status(403).json({ message: 'User is not a super admin' });
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const message = `Your OTP is ${otp}. Please use this to login in Karvaan.`;
    // const response = await twilio.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: user.mobile,
    // });

    console.log(`OTP sent to ${phoneNumber}: ${otp}`); // For debugging purposes

    otpCache.set(phoneNumber, otp);
    res.status(200).json({
      message: 'OTP sent successfully',
      success: true,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const insertTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, mobile, agentId, phoneCode, roleId, superAdmin } = req.body;

    const newUser = new User({
      name,
      email,
      mobile,
      agentId,
      phoneCode,
      roleId,
      superAdmin
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const sendOtpAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      res.status(400).json({ message: 'Agent ID is required' });
      return;
    }
    const user = await User.findOne({ agentId });
    if (!user) {
      res.status(404).json({ message: 'User not found with this Agent ID' });
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const message = `Your OTP is ${otp}. Please use this to login in Karvaan.`;
    // const response = await twilio.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: user.mobile,
    // });

    console.log(`OTP sent to ${user.mobile}: ${otp}`); // For debugging purposes

    otpCache.set(agentId, otp);
    res.status(200).json({
      message: 'OTP sent successfully',
      success: true,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { signingId, otp, superAdmin } = req.body;
    if (!signingId || !otp) {
      res.status(400).json({ message: 'Signing ID and OTP are required' });
      return;
    }

    const cachedOtp = otpCache.get<number>(signingId);
    if (!cachedOtp) {
      res.status(400).json({ message: 'Invalid Signing ID or OTP is expired' });
      return;
    }

    console.log(`Verifying OTP for ${signingId}: ${otp} (cached: ${cachedOtp})`); // For debugging purposes

    if (cachedOtp == otp) {
      otpCache.del(signingId);
      let user: IUser | null = null;
      if (superAdmin) {
        user = await User.findOne({ mobile: signingId, superAdmin });
      } else {
        user = await User.findOne({ agentId: signingId });
      }
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json({ message: 'OTP verified successfully', success: true, user, token: createToken(user.toObject()) });
    } else {
      res.status(400).json({ message: 'Invalid OTP', success: false });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error validating OTP', error: error.message, success: false });
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
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
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
