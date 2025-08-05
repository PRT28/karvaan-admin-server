import mongoose, { Schema, model, Document } from 'mongoose';
import Team from './Team';

export type Tiers = 'tier1' | 'tier2' | 'tier3';

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: Date;
  ownerId: mongoose.Types.ObjectId;
  tier?: Tiers;
}

const customerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
  ownerId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  tier: {
    type: String,
    enum: ['tier1', 'tier2', 'tier3'],
  },
});

const Customer = model<ICustomer>('Customer', customerSchema);

console.log('Team model:', Team.modelName);

export default Customer;
