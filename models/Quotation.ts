import mongoose, { Document, Schema } from 'mongoose';

export type ChannelType = 'B2B' | 'B2C';
export type QuotationType = 'flight' | 'train' | 'hotel' | 'activity';
export type QuotationStatus = 'draft' | 'confirmed' | 'cancelled';

export interface IQuotation extends Document {
  quotationType: QuotationType;
  channel: ChannelType;
  partyId: mongoose.Types.ObjectId;
  partyModel: 'Customer' | 'Vendor';
  businessId: mongoose.Types.ObjectId;
  formFields: Map<String, Object>,
  totalAmount: number;
  status: QuotationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    quotationType: {
      type: String,
      enum: ['flight', 'train', 'hotel', 'activity'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['B2B', 'B2C'],
      required: true,
    },
    partyId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'partyModel',
    },
    partyModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Vendor'],
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true
    },
    formFields: {
      type: Map,
      required: true
    },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'cancelled'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

// Indexes for better performance
QuotationSchema.index({ businessId: 1, createdAt: -1 });
QuotationSchema.index({ businessId: 1, status: 1 });
QuotationSchema.index({ businessId: 1, quotationType: 1 });
QuotationSchema.index({ businessId: 1, channel: 1 });

// Static method to find quotations by business
QuotationSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

export default mongoose.model<IQuotation>('Quotation', QuotationSchema);

