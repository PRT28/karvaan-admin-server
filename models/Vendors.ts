import { Schema, model, Document } from 'mongoose';
import mongoose from 'mongoose';

export interface IVendor extends Document {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  GSTIN?: string;
  address?: string;
  businessId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const vendorSchema = new Schema<IVendor>({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  GSTIN: { type: String },
  address: { type: String },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for better performance
vendorSchema.index({ businessId: 1, email: 1 }, { unique: true }); // Unique email per business
vendorSchema.index({ businessId: 1, companyName: 1 });
vendorSchema.index({ businessId: 1, createdAt: -1 });

// Static method to find vendors by business
vendorSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

const Vendor = model<IVendor>('Vendor', vendorSchema);

export default Vendor;

