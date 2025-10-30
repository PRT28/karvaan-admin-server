import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBusiness extends Document {
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  website?: string;
  description?: string;
  logo?: string;
  gstin?: string;
  panNumber?: string;
  registrationNumber?: string;
  isActive: boolean;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  subscriptionExpiry?: Date;
  adminUserId: Types.ObjectId; // Reference to the admin user
  settings: {
    allowUserRegistration: boolean;
    maxUsers: number;
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
}, { _id: false });

const settingsSchema = new Schema({
  allowUserRegistration: { type: Boolean, default: true },
  maxUsers: { type: Number, default: 10 },
  features: [{ type: String }],
}, { _id: false });

const businessSchema = new Schema<IBusiness>({
  businessName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  businessType: {
    type: String,
    required: true,
    enum: [
      'travel_agency',
      'tour_operator',
      'hotel',
      'restaurant',
      'transport',
      'event_management',
      'consulting',
      'other'
    ],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: addressSchema,
    required: true,
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL starting with http:// or https://'
    }
  },
  description: {
    type: String,
    maxlength: 500,
  },
  logo: {
    type: String, // URL to logo image
    trim: true,
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
      },
      message: 'Invalid GSTIN format'
    }
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: 'Invalid PAN number format'
    }
  },
  registrationNumber: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic',
  },
  subscriptionExpiry: {
    type: Date,
    default: function() {
      // Default to 30 days from now for new businesses
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  adminUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  settings: {
    type: settingsSchema,
    default: {
      allowUserRegistration: true,
      maxUsers: 10,
      features: ['basic_features']
    }
  },
}, {
  timestamps: true,
});

// Indexes for better performance
businessSchema.index({ email: 1 });
businessSchema.index({ businessName: 1 });
businessSchema.index({ isActive: 1 });
businessSchema.index({ subscriptionPlan: 1 });

// Virtual for getting user count
businessSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'businessId',
  count: true,
});

// Method to check if business can add more users
businessSchema.methods.canAddUser = function(): boolean {
  return this.userCount < this.settings.maxUsers;
};

// Method to check if subscription is active
businessSchema.methods.isSubscriptionActive = function(): boolean {
  if (!this.subscriptionExpiry) return false;
  return new Date() <= this.subscriptionExpiry;
};

// Static method to find businesses by type
businessSchema.statics.findByType = function(businessType: string) {
  return this.find({ businessType, isActive: true });
};

const Business = mongoose.model<IBusiness>('Business', businessSchema);
export default Business;
