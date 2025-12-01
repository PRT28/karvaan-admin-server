#!/usr/bin/env ts-node

/**
 * Script to verify the created quotation dummy data
 * Tests various queries and displays comprehensive statistics
 */

import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';

// Import all models to ensure they are registered
import '../models/Business';
import '../models/Customer';
import '../models/Vendors';
import '../models/Team';
import '../models/Traveller';
import '../models/Quotation';

// Now import the models for use
import Quotation from '../models/Quotation';
import Business from '../models/Business';
import Customer from '../models/Customer';
import Vendors from '../models/Vendors';
import Team from '../models/Team';
import Traveller from '../models/Traveller';

configDotenv();

const verifyQuotationData = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    console.log('🔍 Verifying Quotation Dummy Data...\n');
    
    // Get business data
    const business = await Business.findOne({ businessName: 'Test Travel Agency 2' });
    if (!business) {
      console.log('❌ Business not found');
      return;
    }
    
    // Get all quotations for the business
    const quotations = await Quotation.find({ businessId: business._id })
      .populate('customerId', 'name email')
      .populate('vendorId', 'companyName')
      .populate('owner', 'name')
      .populate('travelers', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Total Quotations Found: ${quotations.length}\n`);
    
    // Display all quotations
    console.log('📋 All Quotations:');
    console.log('==================');
    quotations.forEach((q, index) => {
      console.log(`${index + 1}. ${q.customId} - ${q.quotationType.toUpperCase()}`);
      console.log(`   Customer: ${(q.customerId as any)?.name || 'N/A'}`);
      console.log(`   Vendor: ${(q.vendorId as any)?.companyName || 'N/A'}`);
      console.log(`   Amount: ₹${q.totalAmount.toLocaleString()}`);
      console.log(`   Status: ${q.status}`);
      console.log(`   Channel: ${q.channel}`);
      console.log(`   Travel Date: ${q.travelDate.toDateString()}`);
      console.log(`   Travellers: ${q.adultTravlers} adults, ${q.childTravlers} children`);
      console.log(`   Owner: ${(q.owner as any[])?.[0]?.name || 'N/A'}`);
      console.log(`   Travelers: ${(q.travelers as any[])?.map(t => t.name).join(', ') || 'None'}`);
      console.log(`   Remarks: ${q.remarks || 'None'}\n`);
    });
    
    // Statistics by Type
    console.log('📊 Statistics by Quotation Type:');
    console.log('=================================');
    const typeStats = quotations.reduce((acc, q) => {
      acc[q.quotationType] = (acc[q.quotationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(typeStats).forEach(([type, count]) => {
      const typeQuotations = quotations.filter(q => q.quotationType === type);
      const totalAmount = typeQuotations.reduce((sum, q) => sum + q.totalAmount, 0);
      const avgAmount = totalAmount / count;
      console.log(`${type.padEnd(20)}: ${count} quotations | Total: ₹${totalAmount.toLocaleString()} | Avg: ₹${Math.round(avgAmount).toLocaleString()}`);
    });
    
    // Statistics by Status
    console.log('\n📊 Statistics by Status:');
    console.log('========================');
    const statusStats = quotations.reduce((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(statusStats).forEach(([status, count]) => {
      const statusQuotations = quotations.filter(q => q.status === status);
      const totalAmount = statusQuotations.reduce((sum, q) => sum + q.totalAmount, 0);
      console.log(`${status.padEnd(15)}: ${count} quotations | Total: ₹${totalAmount.toLocaleString()}`);
    });
    
    // Statistics by Channel
    console.log('\n📊 Statistics by Channel:');
    console.log('=========================');
    const channelStats = quotations.reduce((acc, q) => {
      acc[q.channel] = (acc[q.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(channelStats).forEach(([channel, count]) => {
      const channelQuotations = quotations.filter(q => q.channel === channel);
      const totalAmount = channelQuotations.reduce((sum, q) => sum + q.totalAmount, 0);
      console.log(`${channel.padEnd(15)}: ${count} quotations | Total: ₹${totalAmount.toLocaleString()}`);
    });
    
    // Customer-wise statistics
    console.log('\n📊 Statistics by Customer:');
    console.log('==========================');
    const customerStats = quotations.reduce((acc, q) => {
      const customerId = (q.customerId as any)?._id?.toString();
      const customerName = (q.customerId as any)?.name;
      if (customerId && customerName) {
        if (!acc[customerId]) {
          acc[customerId] = { name: customerName, count: 0, totalAmount: 0 };
        }
        acc[customerId].count++;
        acc[customerId].totalAmount += q.totalAmount;
      }
      return acc;
    }, {} as Record<string, { name: string; count: number; totalAmount: number }>);
    
    Object.entries(customerStats).forEach(([customerId, stats]) => {
      console.log(`${stats.name.padEnd(20)}: ${stats.count} quotations | Total: ₹${stats.totalAmount.toLocaleString()}`);
    });
    
    // Monthly distribution
    console.log('\n📊 Travel Date Distribution:');
    console.log('============================');
    const monthStats = quotations.reduce((acc, q) => {
      const month = q.travelDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(monthStats).forEach(([month, count]) => {
      console.log(`${month.padEnd(20)}: ${count} quotations`);
    });
    
    // Overall summary
    const totalAmount = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
    const avgAmount = totalAmount / quotations.length;
    
    console.log('\n💰 Financial Summary:');
    console.log('=====================');
    console.log(`Total Revenue: ₹${totalAmount.toLocaleString()}`);
    console.log(`Average Quotation Value: ₹${Math.round(avgAmount).toLocaleString()}`);
    console.log(`Confirmed Revenue: ₹${quotations.filter(q => q.status === 'confirmed').reduce((sum, q) => sum + q.totalAmount, 0).toLocaleString()}`);
    console.log(`Potential Revenue (Draft): ₹${quotations.filter(q => q.status === 'draft').reduce((sum, q) => sum + q.totalAmount, 0).toLocaleString()}`);
    console.log(`Lost Revenue (Cancelled): ₹${quotations.filter(q => q.status === 'cancelled').reduce((sum, q) => sum + q.totalAmount, 0).toLocaleString()}`);
    
    console.log('\n✅ Quotation data verification completed!');
    console.log('\n🎯 Ready to test booking history APIs:');
    console.log('- GET /quotation/booking-history/customer/{customerId}');
    console.log('- GET /quotation/booking-history/vendor/{vendorId}');
    console.log('- GET /quotation/booking-history/traveller/{travellerId}');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error verifying quotation data:', error);
    await mongoose.disconnect();
  }
};

verifyQuotationData();
