import mongoose, { Document, Schema } from 'mongoose';

export type ChannelType = 'B2B' | 'B2C';
export type QuotationType = 'flight' | 'train' | 'hotel' | 'activity';
export type QuotationStatus = 'draft' | 'confirmed' | 'cancelled';

export interface IQuotation extends Document {
  quotationType: QuotationType;
  channel: ChannelType;
  partyId: mongoose.Types.ObjectId;
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
      refPath: 'channel',
    },
    formFields: {
      type: Map,
      reqired: true
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

export default mongoose.model<IQuotation>('Quotation', QuotationSchema);

