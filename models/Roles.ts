import mongoose, { Schema, Document } from 'mongoose';

interface CRUDPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

interface Permissions {
  cooncierce: {
    bookings: {
      limitless: boolean;
      os: boolean;
    };
    directory: {
      customer: boolean;
      vendor: boolean;
      team: boolean;
    };
  };
  settings: {
    companyDetails: CRUDPermissions;
    billing: CRUDPermissions;
    users: CRUDPermissions;
    roles: CRUDPermissions;
    approval: CRUDPermissions;
    deleteAfterApproval: boolean;
    noEditAfterTravelDate: boolean;
    osPrimary: CRUDPermissions;
    osSecondary: CRUDPermissions;
    limitlessPrimary: CRUDPermissions;
    limitlessSecondary: CRUDPermissions;
  };
  bookings: {
    deleteAfterApproval: boolean;
    noEditAfterTravelDate: boolean;
    osPrimary: CRUDPermissions;
    osSecondary: CRUDPermissions;
    limitlessPrimary: CRUDPermissions;
    limitlessSecondary: CRUDPermissions;
  };
}

export interface RoleDocument extends Document {
  roleName: string;
  permission: Permissions;
  businessId: mongoose.Types.ObjectId;
}

const crudPermissionsSchema = new Schema<CRUDPermissions>({
  view: { type: Boolean, required: true },
  add: { type: Boolean, required: true },
  edit: { type: Boolean, required: true },
  delete: { type: Boolean, required: true },
}, { _id: false });

const permissionsSchema = new Schema<Permissions>({
  cooncierce: {
    bookings: {
      limitless: { type: Boolean, required: true },
      os: { type: Boolean, required: true },
    },
    directory: {
      customer: { type: Boolean, required: true },
      vendor: { type: Boolean, required: true },
      team: { type: Boolean, required: true },
    },
  },
  settings: {
    companyDetails: { type: crudPermissionsSchema, required: true },
    billing: { type: crudPermissionsSchema, required: true },
    users: { type: crudPermissionsSchema, required: true },
    roles: { type: crudPermissionsSchema, required: true },
    approval: { type: crudPermissionsSchema, required: true },
    deleteAfterApproval: { type: Boolean, required: true },
    noEditAfterTravelDate: { type: Boolean, required: true },
    osPrimary: { type: crudPermissionsSchema, required: true },
    osSecondary: { type: crudPermissionsSchema, required: true },
    limitlessPrimary: { type: crudPermissionsSchema, required: true },
    limitlessSecondary: { type: crudPermissionsSchema, required: true },
  },
  bookings: {
    deleteAfterApproval: { type: Boolean, required: true },
    noEditAfterTravelDate: { type: Boolean, required: true },
    osPrimary: { type: crudPermissionsSchema, required: true },
    osSecondary: { type: crudPermissionsSchema, required: true },
    limitlessPrimary: { type: crudPermissionsSchema, required: true },
    limitlessSecondary: { type: crudPermissionsSchema, required: true },
  },
}, { _id: false });

const roleSchema = new Schema<RoleDocument>({
  roleName: { type: String, required: true, unique: true },
  permission: { type: permissionsSchema, required: true },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  }
}, {
  timestamps: true,
});

const Role = mongoose.model<RoleDocument>('Role', roleSchema);
export default Role;
