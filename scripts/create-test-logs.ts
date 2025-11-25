import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Logs from '../models/Logs';
import User from '../models/User';
import Team from '../models/Team';

configDotenv();

const createTestLogs = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    // Get a sample user and team member
    const user = await User.findOne({});
    const teamMember = await Team.findOne({});
    
    if (!user || !teamMember) {
      console.log('No user or team member found');
      return;
    }
    
    console.log(`Creating test logs for user: ${user.name} (${user._id})`);
    
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 5);

    // Create test logs with different due dates and priorities
    const testLogs = [
      // Overdue tasks
      {
        activity: 'Complete project documentation',
        userId: user._id,
        businessId: user.businessId,
        dateTime: twoDaysAgo,
        status: 'Pending',
        assignedBy: teamMember._id,
        priority: 'High',
        dueDate: yesterday
      },
      {
        activity: 'Review client feedback',
        userId: user._id,
        businessId: user.businessId,
        dateTime: twoDaysAgo,
        status: 'In Progress',
        assignedBy: teamMember._id,
        priority: 'Medium',
        dueDate: twoDaysAgo
      },
      // Tasks due today
      {
        activity: 'Submit weekly report',
        userId: user._id,
        businessId: user.businessId,
        dateTime: today,
        status: 'Pending',
        assignedBy: teamMember._id,
        priority: 'High',
        dueDate: today
      },
      {
        activity: 'Update project status',
        userId: user._id,
        businessId: user.businessId,
        dateTime: today,
        status: 'In Progress',
        assignedBy: teamMember._id,
        priority: 'Low',
        dueDate: today
      },
      // Upcoming tasks
      {
        activity: 'Prepare presentation slides',
        userId: user._id,
        businessId: user.businessId,
        dateTime: today,
        status: 'Pending',
        assignedBy: teamMember._id,
        priority: 'Medium',
        dueDate: tomorrow
      },
      {
        activity: 'Schedule team meeting',
        userId: user._id,
        businessId: user.businessId,
        dateTime: today,
        status: 'Pending',
        assignedBy: teamMember._id,
        priority: 'Low',
        dueDate: nextWeek
      },
      // Completed task (should not appear in any category)
      {
        activity: 'Complete training module',
        userId: user._id,
        businessId: user.businessId,
        dateTime: yesterday,
        status: 'Completed',
        assignedBy: teamMember._id,
        priority: 'Medium',
        dueDate: yesterday
      }
    ];

    // Delete existing logs for this user to avoid duplicates
    await Logs.deleteMany({ userId: user._id });
    console.log('Deleted existing logs for user');

    // Create new test logs
    const createdLogs = await Logs.insertMany(testLogs);
    console.log(`Created ${createdLogs.length} test logs`);

    // Display summary
    console.log('\n=== TEST LOGS CREATED ===');
    createdLogs.forEach(log => {
      console.log(`- ${log.activity} (Status: ${log.status}, Priority: ${log.priority}, Due: ${log.dueDate.toDateString()})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Test logs created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
};

createTestLogs();
