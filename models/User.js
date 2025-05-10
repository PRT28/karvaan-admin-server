const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  phoneCode: {
    type: Number,
    required: true
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company', // Assuming you have a Company model
    required: true,
  },
  is_karvaan: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'content', 'sales', 'marketing'],
    default: 'user',
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
