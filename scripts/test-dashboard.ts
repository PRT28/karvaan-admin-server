import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Logs from '../models/Logs';
import User from '../models/User';

configDotenv();

const testDashboard = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    // Get a sample user
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found');
      return;
    }
    
    console.log(`Testing dashboard for user: ${user.name} (${user._id})`);
    
    // Get logs for this user
    const logs = await Logs.find({ userId: user._id }).populate('assignedBy', 'name');
    console.log(`Found ${logs.length} logs for this user`);
    
    if (logs.length === 0) {
      console.log('No logs found for this user');
      await mongoose.disconnect();
      return;
    }
    
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Task categorization by due dates
    const taskOverdue: any[] = [];
    const tasksDueToday: any[] = [];
    const upcomingTasks: any[] = [];

    logs.forEach(log => {
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
          taskOverdue.push(taskInfo);
        } else if (dueDate.getTime() === today.getTime()) {
          tasksDueToday.push(taskInfo);
        } else if (dueDate < nextWeek) {
          upcomingTasks.push(taskInfo);
        }
      }
    });

    console.log('\n=== DASHBOARD RESULTS ===');
    console.log(`Overdue tasks: ${taskOverdue.length}`);
    console.log(`Tasks due today: ${tasksDueToday.length}`);
    console.log(`Upcoming tasks (next 7 days): ${upcomingTasks.length}`);
    
    if (taskOverdue.length > 0) {
      console.log('\n--- OVERDUE TASKS ---');
      taskOverdue.forEach(task => {
        console.log(`- ${task.activity} (Priority: ${task.priority}, Due: ${task.dueDate.toDateString()})`);
      });
    }
    
    if (tasksDueToday.length > 0) {
      console.log('\n--- TASKS DUE TODAY ---');
      tasksDueToday.forEach(task => {
        console.log(`- ${task.activity} (Priority: ${task.priority})`);
      });
    }
    
    if (upcomingTasks.length > 0) {
      console.log('\n--- UPCOMING TASKS ---');
      upcomingTasks.forEach(task => {
        console.log(`- ${task.activity} (Priority: ${task.priority}, Due: ${task.dueDate.toDateString()})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Dashboard test completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
};

testDashboard();
