
import { z } from 'zod';


const CRUDSchema = z.object({
  create: z.boolean(),
  read: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
});

const PermissionsSchema = z.object({
  sales: CRUDSchema,
  operateions: z.object({
    voucher: CRUDSchema,
    content: CRUDSchema,
  }),
  userAccess: z.object({
    roles: CRUDSchema,
    user: CRUDSchema,
  }),
});

export const isValidPermissions = (obj: any): obj is Permissions => {
  const result = PermissionsSchema.safeParse(obj);
  return result.success;
};


export const QuotationInputSchema = z.object({
  partyId: z.string().min(1),
  channel: z.enum(['B2C', 'B2B']),
  type: z.enum(['train', 'plane', 'hotel', 'activity']),
  details: z.any(),
  totalAmount: z.number().nonnegative(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});

export type QuotationInput = z.infer<typeof QuotationInputSchema>;
