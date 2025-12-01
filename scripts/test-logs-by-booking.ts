import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Logs from '../models/Logs';
import Business from '../models/Business';
import Team from '../models/Team';

configDotenv();

const testLogsByBooking = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    // Get a business and team member for testing
    const business = await Business.findOne({});
    const teamMember = await Team.findOne({ businessId: business?._id });
    
    if (!business || !teamMember) {
      console.log('No business or team member found for testing');
      return;
    }
    
    console.log(`Testing with business: ${business.businessName}`);
    console.log(`Using team member: ${teamMember.name}`);
    
    // Create a fake booking ID for testing
    const fakeBookingId = new mongoose.Types.ObjectId();
    console.log(`Using fake booking ID: ${fakeBookingId}`);
    
    // Create test logs with different statuses for the same booking
    const testLogs = [
      {
        activity: 'Verify customer documents',
        userId: teamMember._id,
        businessId: business._id,
        assignedBy: teamMember._id,
        assignedTo: [teamMember._id],
        status: 'Completed',
        priority: 'High',
        taskType: 'Documents',
        dueDate: new Date(Date.now() - 86400000), // Yesterday
        category: 'Documentation',
        subCategory: 'Verification',
        bookingId: fakeBookingId,
        logs: [
          {
            heading: 'Task Created',
            description: 'Document verification task created',
            logBy: teamMember.name,
            logDate: new Date(Date.now() - 172800000) // 2 days ago
          },
          {
            heading: 'Task Completed',
            description: 'All documents verified successfully',
            logBy: teamMember.name,
            logDate: new Date(Date.now() - 86400000) // Yesterday
          }
        ]
      },
      {
        activity: 'Process payment confirmation',
        userId: teamMember._id,
        businessId: business._id,
        assignedBy: teamMember._id,
        assignedTo: [teamMember._id],
        status: 'In Progress',
        priority: 'Medium',
        taskType: 'Finance',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        category: 'Payment',
        subCategory: 'Confirmation',
        bookingId: fakeBookingId,
        logs: [
          {
            heading: 'Task Created',
            description: 'Payment confirmation task created',
            logBy: teamMember.name,
            logDate: new Date(Date.now() - 86400000) // Yesterday
          },
          {
            heading: 'Task Started',
            description: 'Started processing payment confirmation',
            logBy: teamMember.name,
            logDate: new Date(Date.now() - 3600000) // 1 hour ago
          }
        ]
      },
      {
        activity: 'Send booking confirmation email',
        userId: teamMember._id,
        businessId: business._id,
        assignedBy: teamMember._id,
        assignedTo: [teamMember._id],
        status: 'Pending',
        priority: 'Low',
        taskType: 'Follow up',
        dueDate: new Date(Date.now() + 172800000), // Day after tomorrow
        category: 'Communication',
        subCategory: 'Email',
        bookingId: fakeBookingId,
        logs: [
          {
            heading: 'Task Created',
            description: 'Email confirmation task created',
            logBy: teamMember.name,
            logDate: new Date()
          }
        ]
      },
      {
        activity: 'Follow up with customer feedback',
        userId: teamMember._id,
        businessId: business._id,
        assignedBy: teamMember._id,
        assignedTo: [teamMember._id],
        status: 'On Hold',
        priority: 'Medium',
        taskType: 'Feedback',
        dueDate: new Date(Date.now() + 259200000), // 3 days from now
        category: 'Customer Service',
        subCategory: 'Feedback',
        bookingId: fakeBookingId,
        logs: [
          {
            heading: 'Task Created',
            description: 'Customer feedback follow-up task created',
            logBy: teamMember.name,
            logDate: new Date(Date.now() - 1800000) // 30 minutes ago
          },
          {
            heading: 'Task On Hold',
            description: 'Waiting for customer response',
            logBy: teamMember.name,
            logDate: new Date(Date.now() - 900000) // 15 minutes ago
          }
        ]
      }
    ];
    
    console.log('\n=== Creating Test Logs ===');
    
    // Clear existing logs for this booking
    await Logs.deleteMany({ bookingId: fakeBookingId });
    console.log('Cleared existing logs for this booking');
    
    // Create the test logs
    const createdLogs = await Logs.insertMany(testLogs);
    console.log(`Created ${createdLogs.length} test logs for booking ${fakeBookingId}`);
    
    // Test the API functionality
    console.log('\n=== Testing API Functionality ===');
    
    // Simulate the API call
    const logs = await Logs.find({ bookingId: fakeBookingId })
      .populate('userId', 'name email')
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      })
      .sort({ dateTime: -1 });
    
    // Group logs by status
    const logsByStatus = {
      Pending: logs.filter(log => log.status === 'Pending'),
      'In Progress': logs.filter(log => log.status === 'In Progress'),
      Completed: logs.filter(log => log.status === 'Completed'),
      'On Hold': logs.filter(log => log.status === 'On Hold')
    };
    
    // Calculate summary
    const summary = {
      totalLogs: logs.length,
      completedCount: logsByStatus.Completed.length,
      pendingCount: logsByStatus.Pending.length,
      inProgressCount: logsByStatus['In Progress'].length,
      onHoldCount: logsByStatus['On Hold'].length,
      completionRate: logs.length > 0 ? Math.round((logsByStatus.Completed.length / logs.length) * 100) : 0
    };
    
    console.log('\n📊 Summary:');
    console.log(`Total Logs: ${summary.totalLogs}`);
    console.log(`Completed: ${summary.completedCount}`);
    console.log(`In Progress: ${summary.inProgressCount}`);
    console.log(`Pending: ${summary.pendingCount}`);
    console.log(`On Hold: ${summary.onHoldCount}`);
    console.log(`Completion Rate: ${summary.completionRate}%`);
    
    console.log('\n📋 Logs by Status:');
    Object.entries(logsByStatus).forEach(([status, statusLogs]) => {
      console.log(`\n${status} (${statusLogs.length}):`);
      statusLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.activity} (Priority: ${log.priority})`);
      });
    });
    
    console.log('\n✅ Logs by booking ID test completed successfully!');
    console.log(`\nTo test the API endpoint, use:`);
    console.log(`GET /logs/booking/${fakeBookingId}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error testing logs by booking:', error);
    await mongoose.disconnect();
  }
};

testLogsByBooking();
