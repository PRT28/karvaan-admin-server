import { Schema, model, Document, Types } from 'mongoose';

export interface ISale extends Document {
  quotation: Types.ObjectId;
  channel: 'B2C' | 'B2B';
  partyId: Types.ObjectId;
  date: Date;
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes?: string;
}

const saleSchema = new Schema<ISale>({
  quotation: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },

  channel: {
    type: String,
    enum: ['B2C', 'B2B'],
    required: true,
  },

  partyId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'partyModel',
  },
  date: {
    type: Date,
    default: Date.now,
  },

  amount: {
    type: Number,
    required: true,
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },

  notes: {
    type: String,
  },
});

export const Sale = model<ISale>('Sale', saleSchema);
