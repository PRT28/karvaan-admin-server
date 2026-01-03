import mongoose, { Schema, model, Document } from 'mongoose';
import Team from './Team';

export type Tiers = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5';

export interface ICustomerDocument {
  originalName: string;
  fileName: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  alias?: string;
  dateOfBirth?: Date;
  gstin?: string;
  companyName?: string;
  openingBalance?: number;
  balanceType?: 'credit' | 'debit';
  address?: string;
  businessId: mongoose.Types.ObjectId;
  createdAt: Date;
  ownerId: mongoose.Types.ObjectId;
  tier?: Tiers;
  isDeleted: boolean;
  customId: string;
  documents: ICustomerDocument[];
  remarks: String;
}

const customerSchema = new Schema<ICustomer>({
  customId: {
    type: String,
    index: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  alias: { type: String },
  dateOfBirth: { type: Date },
  gstin: { type: String },
  companyName: { type: String },
  openingBalance: { type: Number },
  balanceType: { type: String, enum: ['credit', 'debit'] },
  address: { type: String },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  ownerId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  tier: {
    type: String,
    enum: ['tier1', 'tier2', 'tier3', 'tier4', 'tier5'],
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  remarks: { type: String },
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
      message: 'Maximum 3 documents are allowed per customer'
    }
  }
});

// Indexes for better performance
customerSchema.index({ businessId: 1, email: 1 }, { unique: true }); // Unique email per business
customerSchema.index({ businessId: 1, createdAt: -1 });
customerSchema.index({ businessId: 1, tier: 1 });
customerSchema.index({ businessId: 1, customId: 1 }, { unique: true, sparse: true });

// Static method to find customers by business
customerSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

const Customer = model<ICustomer>('Customer', customerSchema);

console.log('Team model:', Team.modelName);

export default Customer;
