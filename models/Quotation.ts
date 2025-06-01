import mongoose, { Document, Schema } from 'mongoose';

export type ChannelType = 'B2B' | 'B2C';
export type QuotationType = 'flight' | 'train' | 'hotel' | 'activity';
export type QuotationStatus = 'draft' | 'confirmed' | 'cancelled';

export interface IQuotation extends Document {
  quotationType: QuotationType;
  channel: ChannelType;
  partyId: mongoose.Types.ObjectId;
  travelDetails: {
    from: string;
    to: string;
    date: Date;
    returnDate?: Date;
    passengers: number;
  };
  items: {
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }[];
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
    travelDetails: {
      from: { type: String, required: true },
      to: { type: String, required: true },
      date: { type: Date, required: true },
      returnDate: { type: Date },
      passengers: { type: Number, required: true },
    },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        description: { type: String },
      },
    ],
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
