import mongoose, { Document, Schema } from 'mongoose';
import Business from './Business';
import Counter from './Counter';

export type QuotationType = 'flight' | 'accommodation' | 'land-transport' | 'maritime-transport' | 'visa' | 'activity' | 'tickets';
export type QuotationStatus = 'confirmed' | 'cancelled';

export type ServiceStatus = 'pending' | 'denied' | 'draft' | 'approved';

export interface IQuotationDocument {
  originalName: string;
  fileName: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface IQuotation extends Document {
  customId: string;
  quotationType: QuotationType;
  businessId: mongoose.Types.ObjectId;
  formFields: Map<String, Object>,
  totalAmount: number;
  status: QuotationStatus;
  createdAt: Date;
  updatedAt: Date;
  owner: Array<mongoose.Types.ObjectId>;
  travelDate: Date;
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  travelers: Array<mongoose.Types.ObjectId>;
  adultTravlers: number;
  childTravlers: number;
  remarks: string;
  isDeleted: boolean;
  serviceStatus: string;
  documents: IQuotationDocument[];
}

const QuotationSchema = new Schema<IQuotation>(
  {
    customId: {
      type: String,
      index: true,
      // Will be auto-generated in pre-save hook
    },
    quotationType: {
      type: String,
      enum: ['flight', 'train', 'hotel', 'activity', 'travel', 'transport-land', 'transport-maritime', 'tickets', 'travel insurance', 'visas', 'others'],
      required: false,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: false,
      index: true
    },
    formFields: {
      type: Map,
      required: false
    },
    totalAmount: { type: Number },
    status: {
      type: String,
      enum: [ 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
    owner: {
      type: [Schema.Types.ObjectId],
      ref: 'Team',
    },
    serviceStatus: {
      type: String,
      enum: ['pending', 'denied', 'draft', 'approved'],
      default: 'approved',
    },
    travelDate: { type: Date, required: false },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: false },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: false },
    travelers: { type: [Schema.Types.ObjectId], ref: 'Traveller', required: false },
    adultTravlers: { type: Number, required: false },
    childTravlers: { type: Number, required: false },
    remarks: { type: String, required: false },
    isDeleted: { type: Boolean, default: false },
    documents: {
      type: [{
        originalName: { type: String, required: false },
        fileName: { type: String, required: false },
        url: { type: String, required: false },
        key: { type: String, required: false },
        size: { type: Number, required: false },
        mimeType: { type: String, required: false },
        uploadedAt: { type: Date, default: Date.now },
      }],
      default: [],
      validate: {
        validator: function(docs: any[]) {
          return docs.length <= 3;
        },
        message: 'Maximum 3 documents are allowed per quotation'
      }
    },
  },
  { timestamps: true }
);

// Indexes for better performance
QuotationSchema.index({ businessId: 1, createdAt: -1 });
QuotationSchema.index({ businessId: 1, status: 1 });
QuotationSchema.index({ businessId: 1, quotationType: 1 });
QuotationSchema.index({ businessId: 1, channel: 1 });
QuotationSchema.index({ businessId: 1, customerId: 1 });
QuotationSchema.index({ businessId: 1, vendorId: 1 });
QuotationSchema.index({ businessId: 1, travelers: 1 });
QuotationSchema.index({ businessId: 1, customId: 1 }, { unique: true, sparse: true });

// Static method to find quotations by business
QuotationSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

// Static method to find quotation by custom ID
QuotationSchema.statics.findByCustomId = function(customId: string) {
  return this.findOne({ customId });
};

export default mongoose.model<IQuotation>('Quotation', QuotationSchema);
