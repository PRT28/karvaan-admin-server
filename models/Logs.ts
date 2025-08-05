import mongoose, { Schema, model, Document } from 'mongoose';
import Team from './Team';

export type Status = 'Pending' | 'Completed' | 'On Hold' |'In Progress';

export interface ILogs extends Document {
    activity: string,
    userId: Schema.Types.ObjectId,
    dateTime: Date,
    status: Status,
    assignedBy: Schema.Types.ObjectId
}

const logSchema = new Schema<ILogs>({
    activity: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    dateTime: {type: Date, required: true, default: new Date()},
    status: {type: String, enum: ['Pending', 'Completed', 'On Hold', 'In Progress'], default: 'Pending'},
    assignedBy: { type: Schema.Types.ObjectId, ref: 'Team', required: true }
})

const Logs = model<ILogs>('Logs', logSchema);

console.log('Team model:', Team.modelName);

export default Logs;