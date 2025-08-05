import mongoose, { Schema, model, Document } from 'mongoose';
import Role from './Roles';

export interface ITeam extends Document {
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: Date;
  roleId?: mongoose.Types.ObjectId;
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
});

const Team = model<ITeam>('Team', teamSchema);

console.log('Role model:', Role.modelName);

export default Team;
