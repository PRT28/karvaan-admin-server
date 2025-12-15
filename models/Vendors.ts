import { Schema, model, Document } from 'mongoose';
import mongoose from 'mongoose';

export type Tiers = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5';

export interface IVendorDocument {
  originalName: string;
  fileName: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface IVendor extends Document {
  companyName: string;
  contactPerson: string;
  alias?: string;
  dateOfBirth?: Date;
  openingBalance?: number;
  balanceType?: 'credit' | 'debit';
  email: string;
  phone: string;
  GSTIN?: string;
  address?: string;
  businessId: mongoose.Types.ObjectId;
  createdAt: Date;
  tier?: Tiers;
  isDeleted: boolean;
  customId: string;
  documents: IVendorDocument[];
}

const vendorSchema = new Schema<IVendor>({
  customId: {
    type: String,
    index: true,
  },
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  alias: { type: String },
  dateOfBirth: { type: Date },
  openingBalance: { type: Number },
  balanceType: { type: String, enum: ['credit', 'debit'] },
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
  tier: {
    type: String,
    enum: ['tier1', 'tier2', 'tier3', 'tier4', 'tier5'],
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  documents: {
    type: [{
      originalName: { type: String, required: true },
      fileName: { type: String, required: true },
      url: { type: String, required: true },
      key: { type: String, required: true },
      size: { type: Number, required: true },
      mimeType: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    }],
    default: [],
    validate: {
      validator: function(docs: any[]) {
        return docs.length <= 3;
      },
      message: 'Maximum 3 documents are allowed per vendor'
    }
  }
});

// Indexes for better performance
vendorSchema.index({ businessId: 1, email: 1 }, { unique: true }); // Unique email per business
vendorSchema.index({ businessId: 1, companyName: 1 });
vendorSchema.index({ businessId: 1, createdAt: -1 });
vendorSchema.index({ businessId: 1, customId: 1 }, { unique: true, sparse: true });

// Static method to find vendors by business
vendorSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

const Vendor = model<IVendor>('Vendor', vendorSchema);

export default Vendor;
