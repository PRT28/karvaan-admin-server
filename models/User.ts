import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  agentId: string | null;
  phoneCode: number;
  roleId: Types.ObjectId;
  businessId: Types.ObjectId | null; // Reference to Business
  userType: 'super_admin' | 'business_admin' | 'business_user';
  isActive: boolean;
  lastLogin?: Date;
  password: string;
  // Legacy field for backward compatibility
  superAdmin: boolean;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  agentId: {
    type: String,
    required: false,
    trim: true,
  },
  phoneCode: {
    type: Number,
    required: true,
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: function(this: IUser) {
      // Business ID is required for business_admin and business_user
      return this.userType === 'business_admin' || this.userType === 'business_user';
    },
  },
  userType: {
    type: String,
    enum: ['super_admin', 'business_admin', 'business_user'],
    required: true,
    default: 'business_user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  password: {
    type: String,
    required: true,
  },
  // Legacy field for backward compatibility
  superAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ businessId: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ isActive: 1 });

// Compound index for business users
userSchema.index({ businessId: 1, userType: 1 });

// Pre-save middleware to sync superAdmin field with userType
userSchema.pre('save', function(next) {
  if (this.userType === 'super_admin') {
    this.superAdmin = true;
    this.businessId = null; // Super admins don't belong to any business
  } else {
    this.superAdmin = false;
  }
  next();
});

// Method to check if user can access business data
userSchema.methods.canAccessBusiness = function(businessId: string): boolean {
  if (this.userType === 'super_admin') return true;
  return this.businessId?.toString() === businessId;
};

// Method to check if user is business admin
userSchema.methods.isBusinessAdmin = function(): boolean {
  return this.userType === 'business_admin';
};

// Static method to find users by business
userSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId, isActive: true });
};

// Static method to find business admins
userSchema.statics.findBusinessAdmins = function(businessId?: string) {
  const query: any = { userType: 'business_admin', isActive: true };
  if (businessId) query.businessId = businessId;
  return this.find(query);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
