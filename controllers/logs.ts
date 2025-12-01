import { Request, Response } from 'express';
import Logs from '../models/Logs';
import mongoose from 'mongoose';

export const createLog = async (req: Request, res: Response) => {
  try {
    const { 
      activity, 
      userId, 
      status,
      dateTime,
      priority,
      taskType,
      dueDate,
      category,
      subCategory,
      bookingId,
      assignedTo 
    } = req.body;

    const log = await Logs.create({
      activity,
      userId,
      status,
      businessId: req.user?.businessId || req.user?._id,
      assignedBy: req?.user?._id,
      dateTime,
      priority,
      taskType,
      dueDate,
      category,
      subCategory,
      bookingId,
      assignedTo,
      logs: [
        {
          heading: 'Task Created',
          description: 'Task created by ' + req.user?.name,
          logBy: req.user?.name,
          logDate: new Date()
        }
      ]
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

    // Build filter based on user type
    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };

    updateData.logs.push({
      heading: 'Task Updated',
      description: 'Task updated by ' + req.user?.name,
      logBy: req.user?.name,
      logDate: new Date()
    })

    delete updateData.businessId;

    const log = await Logs.findOneAndUpdate(filter, updateData, { new: true })
      .populate('userId assignedBy')
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

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
      // Build filter based on user type
      const filter: any = { _id: id };
      if (req.user?.userType !== 'super_admin') {
        filter.businessId = req.user?.businessId;
      }

      const log = await Logs.findById(id);

      if (!log) {
      res.status(404).json({ success: false, message: 'Log not found' });
      } else {
          log?.logs.push({
          heading: 'Status Updated',
          description: 'Status updated to ' + status + ' by ' + req.user?.name,
          logBy: req.user?.name || 'Unknown',
          logDate: new Date()
        })

        log.status = status;
        log?.save();

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

    // Build filter based on user type
    const filter: any = { _id: id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const result = await Logs.findOneAndDelete(filter);

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
    // Filter by business for business users, show all for super admin
    const filter = req.user?.userType === 'super_admin' ? {} : { businessId: req.user?.businessId };

    const logs = await Logs.find(filter)
      .populate('userId assignedBy')
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      })
      .sort({ dateTime: -1 });

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
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Fetch all relevant logs
    const logs = await Logs.find({
      userId: userId
    }).populate('assignedBy', 'name');

    const dateWiseLogs: Record<string, any[]> = {};
    const statusCounts: Record<string, number> = {
      Completed: 0,
      'In Progress': 0,
      Pending: 0,
      'On Hold': 0
    };

    let currentUserPendingTaskCount = 0;
    const totalLogs = logs.length;

    // Task categorization by due dates
    const taskOverdue: any[] = [];
    const tasksDueToday: any[] = [];
    const upcomingTasks: any[] = [];

    const recentLogs = logs
      .sort((a, b) => +new Date(b.dateTime) - +new Date(a.dateTime))
      .slice(0, 3)
      .map(log => ({
        activity: log.activity,
        dateTime: log.dateTime,
        priority: log.priority,
        dueDate: log.dueDate,
        status: log.status
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

      // Categorize tasks by due date (only for non-completed tasks)
      if (log.status !== 'Completed') {
        const dueDate = new Date(log.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const taskInfo = {
          _id: log._id,
          activity: log.activity,
          priority: log.priority,
          dueDate: log.dueDate,
          status: log.status,
          assignedBy: (log.assignedBy as any)?.name || 'Unknown',
          dateTime: log.dateTime
        };

        if (dueDate < today) {
          // Overdue tasks
          taskOverdue.push(taskInfo);
        } else if (dueDate.getTime() === today.getTime()) {
          // Tasks due today
          tasksDueToday.push(taskInfo);
        } else if (dueDate < nextWeek) {
          // Upcoming tasks (within next 7 days)
          upcomingTasks.push(taskInfo);
        }
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

    // Sort tasks by priority and due date
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const sortByPriorityAndDate = (a: any, b: any) => {
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    };

    taskOverdue.sort(sortByPriorityAndDate);
    tasksDueToday.sort(sortByPriorityAndDate);
    upcomingTasks.sort(sortByPriorityAndDate);

    // Status counts and percentages
    const percentageLogs = {
      completedCount: statusCounts.Completed,
      completedPercent: totalLogs ? `${Math.round((statusCounts.Completed / totalLogs) * 100)}%` : '0%',
      inProgressCount: statusCounts['In Progress'],
      pendingCount: statusCounts.Pending,
      onHoldCount: statusCounts['On Hold']
    };

    // Team percentage completion
    const teamPercentCompleteLogs: Record<string, string> = {};
    for (const [name, val] of Object.entries(teamMap)) {
      teamPercentCompleteLogs[name] = `${Math.round((val.completed / val.total) * 100)}%`;
    }

    // Task summary counts
    const taskSummary = {
      overdueCount: taskOverdue.length,
      dueTodayCount: tasksDueToday.length,
      upcomingCount: upcomingTasks.length,
      totalActiveTasksCount: taskOverdue.length + tasksDueToday.length + upcomingTasks.length
    };

    res.json({
      dateWiseLogs,
      percentageLogs,
      recentLogs,
      teamPercentCompleteLogs,
      currentUserPendingTaskCount,
      taskOverdue,
      tasksDueToday,
      upcomingTasks,
      taskSummary
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

export const getLogsByBookingId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ success: false, message: 'Invalid booking ID' });
      return;
    }

    // Build filter based on user type for multi-tenant access control
    const filter: any = { bookingId: bookingId };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const logs = await Logs.find(filter)
      .populate('userId', 'name email')
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      })
      .populate({
        path: 'bookingId',
        select: 'bookingNumber customerName status',
      })
      .sort({ dateTime: -1 });

    if (!logs || logs.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No logs found for this booking ID',
        bookingId: bookingId
      });
      return;
    }

    // Group logs by status for better organization
    const logsByStatus = {
      Pending: logs.filter(log => log.status === 'Pending'),
      'In Progress': logs.filter(log => log.status === 'In Progress'),
      Completed: logs.filter(log => log.status === 'Completed'),
      'On Hold': logs.filter(log => log.status === 'On Hold')
    };

    // Calculate summary statistics
    const summary = {
      totalLogs: logs.length,
      completedCount: logsByStatus.Completed.length,
      pendingCount: logsByStatus.Pending.length,
      inProgressCount: logsByStatus['In Progress'].length,
      onHoldCount: logsByStatus['On Hold'].length,
      completionRate: logs.length > 0 ? Math.round((logsByStatus.Completed.length / logs.length) * 100) : 0
    };

    res.json({
      success: true,
      bookingId: bookingId,
      summary,
      logs,
      logsByStatus
    });

  } catch (error) {
    console.error('Error fetching logs by booking ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs for booking' });
  }
};
