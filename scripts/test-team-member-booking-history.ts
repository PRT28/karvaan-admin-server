#!/usr/bin/env ts-node

/**
 * Script to test the team member booking history API functionality
 * This script directly tests the database queries and logic
 */

import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';

// Import all models to ensure they are registered
import '../models/Business';
import '../models/Team';
import '../models/Quotation';
import '../models/Customer';
import '../models/Vendors';
import '../models/Traveller';

// Now import the models for use
import Business from '../models/Business';
import Team from '../models/Team';
import Quotation from '../models/Quotation';

configDotenv();

const testTeamMemberBookingHistory = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    console.log('🧪 Testing Team Member Booking History Logic...\n');
    
    // Get the test business
    const business = await Business.findOne({ businessName: 'Test Travel Agency 2' });
    if (!business) {
      console.log('❌ Test business not found');
      return;
    }
    
    console.log(`🏢 Testing with Business: ${business.businessName}\n`);

    // Get all team members for this business
    const teamMembers = await Team.find({ businessId: business._id });
    
    console.log(`👥 Found ${teamMembers.length} team members\n`);

    // Test booking history for each team member
    for (const teamMember of teamMembers) {
      console.log(`📋 Testing booking history for: ${teamMember.name}`);
      
      // Find quotations where this team member is in the owner array
      const quotations = await Quotation.find({ 
        owner: teamMember._id,
        businessId: business._id 
      })
      .populate('customerId', 'name email')
      .populate('vendorId', 'companyName')
      .populate('travelers', 'name')
      .sort({ createdAt: -1 });
      
      console.log(`   📊 Found ${quotations.length} quotations owned by ${teamMember.name}`);
      
      if (quotations.length > 0) {
        // Show summary statistics
        const statusCounts = quotations.reduce((acc: any, q) => {
          acc[q.status] = (acc[q.status] || 0) + 1;
          return acc;
        }, {});
        
        const totalValue = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
        
        console.log(`   💰 Total Value: ₹${totalValue.toLocaleString()}`);
        console.log(`   📈 Status Breakdown:`, statusCounts);
        
        // Show recent quotations
        console.log(`   📝 Recent Quotations:`);
        quotations.slice(0, 3).forEach((q, index) => {
          const customerName = q.customerId ? (q.customerId as any).name : 'N/A';
          const vendorName = q.vendorId ? (q.vendorId as any).companyName : 'N/A';
          console.log(`      ${index + 1}. ${q.customId} - ${q.quotationType} - ${q.status} - ₹${q.totalAmount}`);
          console.log(`         Customer: ${customerName}, Vendor: ${vendorName}`);
        });
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary statistics
    console.log('📊 Summary Statistics:');
    
    const allQuotations = await Quotation.find({ businessId: business._id });
    const quotationsWithOwners = allQuotations.filter(q => q.owner && q.owner.length > 0);
    
    console.log(`Total quotations in business: ${allQuotations.length}`);
    console.log(`Quotations with owners: ${quotationsWithOwners.length}`);
    
    // Count quotations per team member
    const ownershipCounts: { [key: string]: number } = {};
    quotationsWithOwners.forEach(q => {
      q.owner.forEach(ownerId => {
        const ownerIdStr = ownerId.toString();
        ownershipCounts[ownerIdStr] = (ownershipCounts[ownerIdStr] || 0) + 1;
      });
    });
    
    console.log('\n👥 Quotations per Team Member:');
    for (const teamMember of teamMembers) {
      const count = ownershipCounts[(teamMember._id as any).toString()] || 0;
      console.log(`   ${teamMember.name}: ${count} quotations`);
    }
    
    // Test filtering capabilities
    console.log('\n🔍 Testing Filter Capabilities:');
    
    // Test status filter
    const confirmedQuotations = await Quotation.find({
      businessId: business._id,
      status: 'confirmed',
      owner: { $in: teamMembers.map(t => t._id) }
    });
    console.log(`Confirmed quotations with team owners: ${confirmedQuotations.length}`);
    
    // Test quotation type filter
    const flightQuotations = await Quotation.find({
      businessId: business._id,
      quotationType: 'flight',
      owner: { $in: teamMembers.map(t => t._id) }
    });
    console.log(`Flight quotations with team owners: ${flightQuotations.length}`);
    
    // Test date range filter (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentQuotations = await Quotation.find({
      businessId: business._id,
      createdAt: { $gte: thirtyDaysAgo },
      owner: { $in: teamMembers.map(t => t._id) }
    });
    console.log(`Recent quotations (last 30 days) with team owners: ${recentQuotations.length}`);
    
    console.log('\n✅ Team member booking history testing completed!');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error testing team member booking history:', error);
    await mongoose.disconnect();
  }
};

testTeamMemberBookingHistory();
