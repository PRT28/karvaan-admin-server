import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Quotation from '../models/Quotation';
import Customer from '../models/Customer';
import Team from '../models/Team';
import Vendor from '../models/Vendors';
import Logs from '../models/Logs';

type SupportedType = 'booking' | 'customer' | 'team' | 'vendor' | 'task';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const ALL = LETTERS + DIGITS;

const shuffle = (chars: string[]): string[] => {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
};

const generateCandidateId = (): string => {
  const baseChars = [
    LETTERS[Math.floor(Math.random() * LETTERS.length)],
    LETTERS[Math.floor(Math.random() * LETTERS.length)],
    DIGITS[Math.floor(Math.random() * DIGITS.length)],
    DIGITS[Math.floor(Math.random() * DIGITS.length)],
    ALL[Math.floor(Math.random() * ALL.length)],
  ];

  return shuffle(baseChars).join('');
};

const getBusinessId = (req: Request): string | undefined => {
  return (req.body?.businessId as string) ||
    (req.user as any)?.businessInfo?.businessId ||
    (req.user as any)?.businessId;
};

const typeModelMap: Record<SupportedType, { exists: (businessId: mongoose.Types.ObjectId, customId: string) => Promise<boolean> }> = {
  booking: {
    exists: async (businessId, customId) => !!(await Quotation.exists({ businessId, customId, isDeleted: false })),
  },
  customer: {
    exists: async (businessId, customId) => !!(await Customer.exists({ businessId, customId, isDeleted: false })),
  },
  team: {
    exists: async (businessId, customId) => !!(await Team.exists({ businessId, customId })),
  },
  vendor: {
    exists: async (businessId, customId) => !!(await Vendor.exists({ businessId, customId, isDeleted: false })),
  },
  task: {
    exists: async (businessId, customId) => !!(await Logs.exists({ businessId, customId })),
  },
};

export const generateCustomId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.body as { type?: string };
    if (!type) {
      res.status(400).json({ success: false, message: 'type is required' });
      return;
    }

    const normalizedType = type.toLowerCase() as SupportedType;
    if (!typeModelMap[normalizedType]) {
      res.status(400).json({ success: false, message: 'Invalid type. Allowed values: booking, customer, team, vendor, task' });
      return;
    }

    const businessId = getBusinessId(req);
    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
      res.status(400).json({ success: false, message: 'Valid businessId is required' });
      return;
    }

    const businessObjectId = new mongoose.Types.ObjectId(businessId);
    const maxAttempts = 25;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = generateCandidateId();
      const exists = await typeModelMap[normalizedType].exists(businessObjectId, candidate);
      if (!exists) {
        res.status(200).json({
          success: true,
          type: normalizedType,
          customId: candidate,
        });
        return;
      }
    }

    res.status(500).json({ success: false, message: 'Could not generate a unique custom ID. Please try again.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom ID',
      error: (error as Error).message,
    });
  }
};
