import { Schema, model, Document, Types } from 'mongoose';

export interface ISale extends Document {
  quotation: Types.ObjectId;
  channel: 'B2C' | 'B2B';
  partyId: Types.ObjectId;
  businessId: Types.ObjectId;
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
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
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

// Indexes for better performance
saleSchema.index({ businessId: 1, date: -1 });
saleSchema.index({ businessId: 1, paymentStatus: 1 });
saleSchema.index({ businessId: 1, channel: 1 });

// Static method to find sales by business
saleSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

export const Sale = model<ISale>('Sale', saleSchema);
