import { Request, Response } from 'express';
import mongoose from 'mongoose';
import MakerCheckerGroup from '../models/MakerCheckerGroup';

const getBusinessIdFromRequest = (req: Request): string | undefined => {
  const businessInfoId = req.user?.businessInfo?.businessId;
  if (businessInfoId) return businessInfoId.toString();

  const userBusinessId = req.user?.businessId;
  if (!userBusinessId) return undefined;

  if (typeof userBusinessId === 'string') return userBusinessId;
  if (typeof userBusinessId === 'object' && (userBusinessId as any)._id) {
    return (userBusinessId as any)._id.toString();
  }

  return undefined;
};

const parseObjectIdArray = (value: any, fieldName: string): { ids?: string[]; error?: string } => {
  if (!Array.isArray(value)) {
    return { error: `${fieldName} must be an array of user IDs` };
  }

  const invalidIds = value.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return { error: `${fieldName} contains invalid user IDs` };
  }

  return { ids: value };
};

const populateGroup = (query: any) => {
  return query
    .populate({ path: 'makers', select: 'name email designation userType isActive' })
    .populate({ path: 'checkers', select: 'name email designation userType isActive' })
    .populate({ path: 'businessId', select: 'businessName businessType' });
};

export const createMakerCheckerGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, status, makers, checkers, type } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    if (!type || !['booking', 'finance'].includes(type)) {
      res.status(400).json({ message: 'Type must be one of: booking, finance' });
      return;
    }

    const makersResult = parseObjectIdArray(makers, 'makers');
    if (makersResult.error) {
      res.status(400).json({ message: makersResult.error });
      return;
    }

    const checkersResult = parseObjectIdArray(checkers, 'checkers');
    if (checkersResult.error) {
      res.status(400).json({ message: checkersResult.error });
      return;
    }

    let businessId = getBusinessIdFromRequest(req);
    if (req.user?.userType === 'super_admin') {
      businessId = req.body.businessId || businessId;
    }

    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
      res.status(400).json({ message: 'Valid businessId is required' });
      return;
    }

    const group = await MakerCheckerGroup.create({
      name,
      status,
      makers: makersResult.ids,
      checkers: checkersResult.ids,
      type,
      businessId,
    });

    const populatedGroup = await populateGroup(MakerCheckerGroup.findById(group._id));
    res.status(201).json({ group: populatedGroup });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    res.status(500).json({ message: 'Failed to create maker checker group', error: message });
  }
};

export const getMakerCheckerGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};

    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(400).json({ message: 'Business context is missing' });
        return;
      }
      filter.businessId = businessId;
    } else if (req.query.businessId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.businessId as string)) {
        res.status(400).json({ message: 'Invalid businessId filter' });
        return;
      }
      filter.businessId = req.query.businessId;
    }

    if (req.query.type) {
      if (!['booking', 'finance'].includes(req.query.type as string)) {
        res.status(400).json({ message: 'Invalid type filter' });
        return;
      }
      filter.type = req.query.type;
    }

    const groups = await populateGroup(MakerCheckerGroup.find(filter));
    res.status(200).json({ groups });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    res.status(500).json({ message: 'Failed to fetch maker checker groups', error: message });
  }
};

export const getMakerCheckerGroupById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(400).json({ message: 'Business context is missing' });
        return;
      }
      filter.businessId = businessId;
    }

    const group = await populateGroup(MakerCheckerGroup.findOne(filter));

    if (!group) {
      res.status(404).json({ message: 'Maker checker group not found' });
      return;
    }

    res.status(200).json({ group });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    res.status(500).json({ message: 'Failed to fetch maker checker group', error: message });
  }
};

export const updateMakerCheckerGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(400).json({ message: 'Business context is missing' });
        return;
      }
      filter.businessId = businessId;
    }

    const updateData: any = { ...req.body };
    delete updateData.businessId;

    if (updateData.type && !['booking', 'finance'].includes(updateData.type)) {
      res.status(400).json({ message: 'Type must be one of: booking, finance' });
      return;
    }

    if (updateData.makers !== undefined) {
      const makersResult = parseObjectIdArray(updateData.makers, 'makers');
      if (makersResult.error) {
        res.status(400).json({ message: makersResult.error });
        return;
      }
      updateData.makers = makersResult.ids;
    }

    if (updateData.checkers !== undefined) {
      const checkersResult = parseObjectIdArray(updateData.checkers, 'checkers');
      if (checkersResult.error) {
        res.status(400).json({ message: checkersResult.error });
        return;
      }
      updateData.checkers = checkersResult.ids;
    }

    const group = await populateGroup(
      MakerCheckerGroup.findOneAndUpdate(filter, updateData, { new: true })
    );

    if (!group) {
      res.status(404).json({ message: 'Maker checker group not found' });
      return;
    }

    res.status(200).json({ group });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    res.status(500).json({ message: 'Failed to update maker checker group', error: message });
  }
};

export const deleteMakerCheckerGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(400).json({ message: 'Business context is missing' });
        return;
      }
      filter.businessId = businessId;
    }

    const group = await MakerCheckerGroup.findOneAndDelete(filter);

    if (!group) {
      res.status(404).json({ message: 'Maker checker group not found' });
      return;
    }

    res.status(200).json({ message: 'Maker checker group deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    res.status(500).json({ message: 'Failed to delete maker checker group', error: message });
  }
};

export const updateMakersList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    const { makers } = req.body;
    const makersResult = parseObjectIdArray(makers, 'makers');
    if (makersResult.error) {
      res.status(400).json({ message: makersResult.error });
      return;
    }

    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(400).json({ message: 'Business context is missing' });
        return;
      }
      filter.businessId = businessId;
    }

    const group = await populateGroup(
      MakerCheckerGroup.findOneAndUpdate(filter, { makers: makersResult.ids }, { new: true })
    );

    if (!group) {
      res.status(404).json({ message: 'Maker checker group not found' });
      return;
    }

    res.status(200).json({ group });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    res.status(500).json({ message: 'Failed to update makers list', error: message });
  }
};

export const updateCheckersList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    const { checkers } = req.body;
    const checkersResult = parseObjectIdArray(checkers, 'checkers');
    if (checkersResult.error) {
      res.status(400).json({ message: checkersResult.error });
      return;
    }

    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      const businessId = getBusinessIdFromRequest(req);
      if (!businessId) {
        res.status(400).json({ message: 'Business context is missing' });
        return;
      }
      filter.businessId = businessId;
    }

    const group = await populateGroup(
      MakerCheckerGroup.findOneAndUpdate(filter, { checkers: checkersResult.ids }, { new: true })
    );

    if (!group) {
      res.status(404).json({ message: 'Maker checker group not found' });
      return;
    }

    res.status(200).json({ group });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    res.status(500).json({ message: 'Failed to update checkers list', error: message });
  }
};
