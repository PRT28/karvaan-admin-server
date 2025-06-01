import mongoose, { Schema, Document } from 'mongoose';

interface CRUDPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

interface Permissions {
  sales: CRUDPermissions;
  operateions: {
    voucher: CRUDPermissions;
    content: CRUDPermissions;
  };
  userAccess: {
    roles: CRUDPermissions;
    user: CRUDPermissions;
  };
}

export interface RoleDocument extends Document {
  roleName: string;
  permission: Permissions;
}

const crudPermissionsSchema = new Schema<CRUDPermissions>({
  create: { type: Boolean, required: true },
  read: { type: Boolean, required: true },
  update: { type: Boolean, required: true },
  delete: { type: Boolean, required: true },
}, { _id: false });

const permissionsSchema = new Schema<Permissions>({
  sales: { type: crudPermissionsSchema, required: true },
  operateions: {
    voucher: { type: crudPermissionsSchema, required: true },
    content: { type: crudPermissionsSchema, required: true },
  },
  userAccess: {
    roles: { type: crudPermissionsSchema, required: true },
    user: { type: crudPermissionsSchema, required: true },
  }
}, { _id: false });

const roleSchema = new Schema<RoleDocument>({
  roleName: { type: String, required: true, unique: true },
  permission: { type: permissionsSchema, required: true },
}, {
  timestamps: true,
});

const Role = mongoose.model<RoleDocument>('Role', roleSchema);
export default Role;
