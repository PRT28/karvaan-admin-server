import { Schema, model, Document } from 'mongoose';

export interface IVendor extends Document {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  GSTIN?: string;
  address?: string;
  createdAt: Date;
}

const vendorSchema = new Schema<IVendor>({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  GSTIN: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Vendor = model<IVendor>('Vendor', vendorSchema);

export default Vendor;

