import { Request, Response } from 'express';
import Team from '../models/Team';
import Quotation from '../models/Quotation';
import Logs from '../models/Logs';
import mongoose from 'mongoose';

export const createTeam = async (req: Request, res: Response) => {
  try {
    // Add businessId from authenticated user
    const teamData = {
      ...req.body,
      businessId: req.user?.businessId || req.user?._id // Use businessId or fallback to user ID for super admin
    };

    const team = await Team.create(teamData);
    res.status(201).json({ team });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create team', message: errorMessage });
  }
};

export const getTeams = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all teams');

    // Filter by business for business users, show all for super admin
    const filter = req.user?.userType === 'super_admin' ? {} : { businessId: req.user?.businessId };

    const teams = await Team.find(filter)
      .populate({
        path: 'roleId',
        select: 'roleName -_id', // Only get roleName
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    // Add isDeletable field to each team member
    const teamsWithDeletable = await Promise.all(
      teams.map(async (team) => {
        // Check if team member is referenced in any quotations (owner field)
        const quotationCount = await Quotation.countDocuments({
          owner: team._id,
          businessId: team.businessId
        });

        // Check if team member is referenced in any logs (userId, assignedBy, or assignedTo fields)
        const logCount = await Logs.countDocuments({
          $or: [
            { userId: team._id },
            { assignedBy: team._id },
            { assignedTo: team._id }
          ],
          businessId: team.businessId
        });

        return {
          ...team.toObject(),
          isDeletable: quotationCount === 0 && logCount === 0
        };
      })
    );

    res.status(200).json(teamsWithDeletable);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams', message: errorMessage });
  }
};

export const getTeamById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const team = await Team.findOne(filter)
      .populate({
        path: 'roleId',
        select: 'roleName -_id',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    res.status(200).json({ team });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch team by ID', message: errorMessage });
  }
};

export const updateTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;

    const team = await Team.findOneAndUpdate(filter, updateData, { new: true })
      .populate({
        path: 'roleId',
        select: 'roleName -_id',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    res.status(200).json({ team });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to update team', message: errorMessage });
  }
};

export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const id = req.params.id;

    const team = await Team.findByIdAndUpdate(id, {isDeleted: true}, { new: true, runValidators: true });
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    res.status(200).json({ message: 'Team deleted' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to delete team', message: errorMessage });
  }
};
