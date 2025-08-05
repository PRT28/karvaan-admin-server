import { Request, Response } from 'express';
import Logs from '../models/Logs';
import mongoose from 'mongoose';

export const createLog = async (req: Request, res: Response) => {
  try {
    const { activity, userId, status } = req.body;

    const log = await Logs.create({
      activity,
      userId,
      status,
      assignedBy: req?.user?._id,
      dateTime: new Date()
    });

    res.status(201).json({ success: true, log });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ success: false, message: 'Failed to create log' });
  }
};

export const updateLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body; // e.g., { activity: "New task", assignedBy: "..." }

    const log = await Logs.findByIdAndUpdate(id, updates, { new: true });

    if (!log) {
     res.status(404).json({ success: false, message: 'Log not found' });
    } else {
      res.json({ success: true, log });
    }
    
  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({ success: false, message: 'Failed to update log' });
  }
};

export const updateLogStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Completed', 'On Hold', 'In Progress'].includes(status)) {
     res.status(400).json({ success: false, message: 'Invalid status' });
    } else {
      const log = await Logs.findByIdAndUpdate(id, { status }, { new: true });

      if (!log) {
      res.status(404).json({ success: false, message: 'Log not found' });
      } else {
        res.json({ success: true, log });
      }

      
    }

    
  } catch (error) {
    console.error('Error updating log status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

export const deleteLog = async (req: Request, res: Response): Promise<void>  => {
  try {
    const { id } = req.params;

    const result = await Logs.findByIdAndDelete(id);

    if (!result) {
        res.status(404).json({ success: false, message: 'Log not found' });
    } else {
        res.json({ success: true, message: 'Log deleted successfully' });
    }
    
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ success: false, message: 'Failed to delete log' });
  }
};

export const getAllLogs = async (req: Request, res: Response) => {
  try {
    const logs = await Logs.find().populate('userId assignedBy');

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
};

export const getUserLogsDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 2);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 2);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all relevant logs
    const logs = await Logs.find({
      userId: userId,
      dateTime: { $gte: startDate, $lte: endDate }
    }).populate('assignedBy', 'name');

    const dateWiseLogs: Record<string, any[]> = {};
    const statusCounts: Record<string, number> = {
      Completed: 0,
      'In Progress': 0,
      Pending: 0
    };

    let currentUserPendingTaskCount = 0;
    const totalLogs = logs.length;

    const recentLogs = logs
      .sort((a, b) => +new Date(b.dateTime) - +new Date(a.dateTime))
      .slice(0, 3)
      .map(log => ({
        activity: log.activity,
        dateTime: log.dateTime
      }));

    const teamMap: Record<string, { completed: number; total: number }> = {};

    logs.forEach(log => {
      const date = new Date(log.dateTime).toISOString().split('T')[0]; // yyyy-mm-dd
      if (!dateWiseLogs[date]) {
        dateWiseLogs[date] = [];
      }
      dateWiseLogs[date].push(log);

      // Count status
      if (log.status in statusCounts) {
        statusCounts[log.status]++;
      }

      // Count user's own pending tasks
      if (log.status === 'Pending') {
        currentUserPendingTaskCount++;
      }

      // Calculate team % complete
      const assignerName = (log.assignedBy as any)?.name || 'Unknown';
      if (!teamMap[assignerName]) {
        teamMap[assignerName] = { completed: 0, total: 0 };
      }
      if (log.status === 'Completed') {
        teamMap[assignerName].completed++;
      }
      teamMap[assignerName].total++;
    });

    // Status counts and percentages
    const percentageLogs = {
      completedCount: statusCounts.Completed,
      completedPercent: totalLogs ? `${Math.round((statusCounts.Completed / totalLogs) * 100)}%` : '0%',
      inProgressCount: statusCounts['In Progress'],
      pendingCount: statusCounts.Pending
    };

    // Team percentage completion
    const teamPercentCompleteLogs: Record<string, string> = {};
    for (const [name, val] of Object.entries(teamMap)) {
      teamPercentCompleteLogs[name] = `${Math.round((val.completed / val.total) * 100)}%`;
    }

    res.json({
      dateWiseLogs,
      percentageLogs,
      recentLogs,
      teamPercentCompleteLogs,
      currentUserPendingTaskCount
    });
  } catch (error) {
    console.error('Error fetching user logs dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user logs' });
  }
};



export const getUserLogsByMonth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const month = parseInt(req.query.month as string); // 1-12
    const year = parseInt(req.query.year as string);   // e.g. 2025

    if (!month || !year || !userId) {
      res.status(400).json({ message: 'userId, month, and year are required' });
    } else {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last moment of the month

        const logs = await Logs.aggregate([
        {
            $match: {
            userId: new mongoose.Types.ObjectId(userId),
            dateTime: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $addFields: {
            day: { $dayOfMonth: '$dateTime' }
            }
        },
        {
            $group: {
            _id: '$day',
            logs: { $push: '$$ROOT' }
            }
        },
        {
            $sort: { _id: 1 }
        }
        ]);

        // Transform array to object: { "1": [...], "2": [...] }
        const logsByDay: Record<string, any[]> = {};
        logs.forEach(group => {
        logsByDay[group._id.toString()] = group.logs;
        });

        res.status(200).json({ userId, month, year, logsByDay });
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};
