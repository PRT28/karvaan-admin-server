import axios from 'axios';
import { Request, Response } from 'express';
import User from '../models/User';
import { createToken } from '../utils/jwt';
import { isValidPermissions } from '../utils/utils';
import Role from '../models/Roles';

const otpLessHeaders = {
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  'Content-Type': 'application/json',
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, phoneCode } = req.body;
    if (!phoneNumber || !phoneCode) {
      res.status(400).json({ message: 'Phone number and phone code are required' });
      return;
    }

    const otpLessBody = {
      phoneNumber: phoneCode + phoneNumber,
      channel: 'SMS',
      otpLength: 6,
      expiry: 60,
    };

    try {
      const response = await axios.post('https://auth.otpless.app/auth/otp/v1/send', otpLessBody, { headers: otpLessHeaders });
      res.status(200).json({ message: 'OTP sent successfully', data: response.data });
    } catch (error: any) {
      res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, otp, phoneNumber, phoneCode } = req.body;
    if (!requestId || !otp) {
      res.status(400).json({ message: 'RequestID and OTP are required' });
      return;
    }

    try {
      const response = await axios.post('https://auth.otpless.app/auth/otp/v1/send', { requestId, otp }, { headers: otpLessHeaders });
      const user = await User.findOne({ phoneNum: phoneCode + phoneNumber });

      const token = user ? createToken(user) : null;
      res.status(200).json({
        message: 'OTP verified successfully',
        data: response.data,
        token,
        user,
        success: true,
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error validating OTP', error: error.message, success: false });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message, success: false });
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
