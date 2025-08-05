import { Request, Response } from 'express';
import Team from '../models/Team';

export const createTeam = async (req: Request, res: Response) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json({ team });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create team', message: errorMessage });
  }
};

export const getTeams = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all teams');
    const teams = await Team.find().populate({
      path: 'roleId',
      select: 'roleName -_id', // Only get roleName
    });

    res.status(200).json(teams);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams', message: errorMessage });
  }
};

export const getTeamById = async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await Team.findById(req.params.id).populate({
      path: 'roleId',
      select: 'roleName -_id',
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
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    const team = await Team.findByIdAndDelete(req.params.id);
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
