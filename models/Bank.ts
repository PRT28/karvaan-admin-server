import mongoose, { Schema, model, Document } from 'mongoose';

export interface IBank extends Document {
  name: string;
  accountNumber: string;
  businessId: mongoose.Types.ObjectId;
  isDeleted: boolean;
  ifscCode: string;
  accountType: 'savings' | 'current';
}

const bankSchema = new Schema<IBank>({
  name: { type: String, required: true },
  accountNumber: { type: String, required: true },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  ifscCode: { type: String, required: true },
  accountType: {
    type: String,
    enum: ['savings', 'current'],
    required: true,
  },
}, {
  timestamps: true,
});

const Bank = model<IBank>('Bank', bankSchema);

export default Bank;
