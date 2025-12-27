
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


export function generateSecurePassword() {

  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";

  const allChars = upper + lower + numbers + symbols;

  const cryptoObj = window.crypto || require("crypto").webcrypto;
  const randomValues = new Uint32Array(16);
  cryptoObj.getRandomValues(randomValues);

  // Ensure at least one character from each category
  let password = [
    upper[randomValues[0] % upper.length],
    lower[randomValues[1] % lower.length],
    numbers[randomValues[2] % numbers.length],
    symbols[randomValues[3] % symbols.length],
  ];

  // Fill the remaining characters
  for (let i = 4; i < 16; i++) {
    password.push(allChars[randomValues[i] % allChars.length]);
  }

  // Shuffle password securely
  for (let i = password.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}
