const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
 
    phoneNum: {
        type: String,
        required: true,
        unique: true
    },
    companyName: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    GSTIN: {
        type: String,
        required: true,
        unique: true
    },
    companyEmail: {
        type: String,
        required: true,
        unique: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
