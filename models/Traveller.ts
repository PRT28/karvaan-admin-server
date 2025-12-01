import mongoose, { Schema, model, Document } from 'mongoose';

export interface ITraveller extends Document {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  businessId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId; // Reference to customer if traveller is associated with a customer
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const emergencyContactSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true }
}, { _id: false });

const travellerSchema = new Schema<ITraveller>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
travellerSchema.index({ businessId: 1, createdAt: -1 });
travellerSchema.index({ businessId: 1, isDeleted: 1 });
travellerSchema.index({ businessId: 1, ownerId: 1 });

// Static method to find travellers by business
travellerSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId, isDeleted: false });
};

// Static method to find travellers by customer
travellerSchema.statics.findByOwner = function(ownerId: string) {
  return this.find({ ownerId, isDeleted: false });
};

const Traveller = model<ITraveller>('Traveller', travellerSchema);

export default Traveller;
