import mongoose, { Schema, model, Document } from 'mongoose';
import Role from './Roles';

export interface ITeamDocument {
  originalName: string;
  fileName: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ITeam extends Document {
  name: string; // first name + last name
  email: string; // work email
  dateOfBirth?: Date; // date of birth
  gender?: string; // gender
  emergencyContact?: string; //emergency contact
  alias?: string; // alias
  designation?: string; //designation
  dateOfJoining?: Date; //date of joining
  dateOfLeaving?: Date; //date of leaving
  phone: string; // work contact
  businessId: mongoose.Types.ObjectId;
  createdAt: Date;
  remarks?: string;
  status: 'Former' | 'Current';
  documents: ITeamDocument[];
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  emergencyContact: { type: String },
  alias: { type: String },
  designation: { type: String },
  dateOfJoining: { type: Date },
  dateOfLeaving: { type: Date },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  remarks: { type: String },
  status: {
    type: String,
    enum: ['Former', 'Current'],
    default: 'Current',
  },
  documents: {
    type: [{
      originalName: { type: String, required: true },
      fileName: { type: String, required: true },
      url: { type: String, required: true },
      key: { type: String, required: true },
      size: { type: Number, required: true },
      mimeType: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    }],
    default: [],
    validate: {
      validator: function(docs: any[]) {
        return docs.length <= 3;
      },
      message: 'Maximum 3 documents are allowed per team member'
    }
  }
});

// Indexes for better performance
teamSchema.index({ businessId: 1, email: 1 }, { unique: true }); // Unique email per business
teamSchema.index({ businessId: 1, createdAt: -1 });

// Static method to find teams by business
teamSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businessId });
};

const Team = model<ITeam>('Team', teamSchema);

console.log('Role model:', Role.modelName);

export default Team;
