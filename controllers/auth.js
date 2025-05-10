const { default: axios } = require('axios');
const User = require('../models/User');
const { createToken } = require('../utils/jwt');
const Company = require('../models/Company');

const otpLessHeaders = headers = {
    "clientId": process.env.CLIENT_ID,
    "clientSecret": process.env.CLIENT_SECRET,
    "Content-Type": "application/json",
}

const sendOtp = async (req, res) => {
  try {
    const {phoneNumber, phoneCode} = req.body;
    if (!(phoneNumber || phoneCode)) {
      return res.status(400).json({ message: 'Phone number and phone code are required' });
    }
    const otpLessBody = {
        phoneNumber: phoneCode + phoneNumber,
        channel: "SMS",
        otpLength: 6,
        expiry: 60
    }
    
   axios.post("https://auth.otpless.app/auth/otp/v1/send", otpLessBody, { headers: otpLessHeaders })
    .then(response => {
        res.status(200).json({
            message: 'OTP sent successfully',
            data: response.data
        })
    })
    .catch(error => {
        res.status(500).json({
            message: 'Error sending OTP',
            error: error.message
        })
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const verifyOtp = async (req, res) => {
    try{
    const {requestId, otp, phoneNumber, phoneCode} = req.body;
    if (!(requestId || otp)) {
      return res.status(400).json({ message: 'RequestID and OTP are required' });
    }
    
   axios.post("https://auth.otpless.app/auth/otp/v1/send", {
    requestId,
    otp
   }, { headers: otpLessHeaders })
    .then(response => {

        User.findOne({
            phoneNum: phoneCode + phoneNumber
        })
        .then(user => {
            if (user) {
                const token = createToken(user);

                res.status(200).json({
                    message: 'OTP verified successfully',
                    data: response.data,
                    token: token,
                    user: user,
                    success: true
                })
            } else {

                res.status(200).json({
                    message: 'OTP verified successfully',
                    data: response.data,
                    token: null,
                    user: null,
                    success: true
                })
                
            }
        })
        .catch(error => {
            res.status(500).json({
                message: 'Error finding user',
                error: error.message,
                success: false
            })
        })
    })
    .catch(error => {
        res.status(500).json({
            message: 'Error validating OTP',
            error: error.message,
            success: false
        })
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message, success: false });
  }
};

const createNewCompanyUser = async (req, res) => {
    try {
        const { phoneNumber, phoneCode, companyName, firstName, lastName, email, GSTIN, companyEmail } = req.body;
        if (!phoneCode || !phoneNumber || !companyName || !firstName || !lastName || !email || !GSTIN || !companyEmail) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const company = new Company({
            phoneNum: phoneCode + phoneNumber,
            companyName,
            firstName,
            lastName,
            email,
            GSTIN,
            companyEmail,
            isVerified: false
        });
        await company.save();
        res.status(201).json({ message: 'Company registered for verification successfully', user })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

const getListOfUnverifiedCompany = async (req, res) => {
    try {
        const {search} = req.query
        const query = search ? { $or: [{ companyName: { $regex: search, $options: 'i' } }, { _id: search }] } : {};
        const companies = await Company.find({ isVerified: false, ...query });
        res.status(200).json({ companies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

const markCompanyAsVerified = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findByIdAndUpdate(id, { isVerified: true }, { new: true });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company marked as verified successfully', company });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

module.exports = {sendOtp, verifyOtp, createNewCompanyUser, getListOfUnverifiedCompany, markCompanyAsVerified}
