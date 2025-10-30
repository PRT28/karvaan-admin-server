import mongoose, { Schema, model, Document } from 'mongoose';
import Role from './Roles';

export interface ITeam extends Document {
  name: string;
  email: string;
  phone: string;
  address?: string;
  businessId: mongoose.Types.ObjectId;
  createdAt: Date;
  roleId?: mongoose.Types.ObjectId;
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
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
