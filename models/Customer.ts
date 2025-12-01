import mongoose, { Schema, model, Document } from 'mongoose';
import Team from './Team';

export type Tiers = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5';

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
}

const customerSchema = new Schema<ICustomer>({
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
  }
});

// Indexes for better performance
customerSchema.index({ businessId: 1, email: 1 }, { unique: true }); // Unique email per business
customerSchema.index({ businessId: 1, createdAt: -1 });
customerSchema.index({ businessId: 1, tier: 1 });

// Static method to find customers by business
customerSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

const Customer = model<ICustomer>('Customer', customerSchema);

console.log('Team model:', Team.modelName);

export default Customer;
