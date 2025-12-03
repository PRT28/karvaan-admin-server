#!/usr/bin/env ts-node

/**
 * Script to test the fixed createQuotation function
 * This script validates the data flow and identifies issues
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
import Business from '../models/Business';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import Team from '../models/Team';
import Traveller from '../models/Traveller';
import Quotation from '../models/Quotation';

configDotenv();

const testCreateQuotationFix = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    console.log('🧪 Testing Create Quotation Fix...\n');
    
    // Get the test business
    const business = await Business.findOne({ businessName: 'Test Travel Agency 2' });
    if (!business) {
      console.log('❌ Test business not found');
      return;
    }
    
    console.log(`🏢 Using Business: ${business.businessName} (${business._id})\n`);

    // Get sample data for testing
    const customers = await Customer.find({ businessId: business._id }).limit(2);
    const vendors = await Vendor.find({ businessId: business._id }).limit(2);
    const teamMembers = await Team.find({ businessId: business._id }).limit(2);
    const travellers = await Traveller.find({ businessId: business._id }).limit(2);
    
    console.log(`📊 Available Data:`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Vendors: ${vendors.length}`);
    console.log(`   Team Members: ${teamMembers.length}`);
    console.log(`   Travellers: ${travellers.length}\n`);

    if (customers.length === 0 || teamMembers.length === 0) {
      console.log('❌ Insufficient test data. Need at least 1 customer and 1 team member.');
      return;
    }

    // Test Case 1: Valid B2C Quotation
    console.log('🧪 Test Case 1: Valid B2C Quotation');
    
    const testPayload1 = {
      quotationType: "travel",
      channel: "B2C",
      formFields: {
        firstname: "John",
        lastname: "Doe",
        contactnumber: "+91-9876543210",
        emailId: "john.doe@example.com",
        bookingdate: "2024-12-15",
        traveldate: "2024-12-20",
        bookingstatus: "Confirmed",
        costprice: 15000,
        sellingprice: 18000
      },
      totalAmount: 18000,
      status: "confirmed",
      travelDate: "2024-12-20",
      customerId: (customers[0]._id as any).toString(),
      travelers: travellers.length > 0 ? [(travellers[0]._id as any).toString()] : [],
      adultTravlers: 1,
      childTravlers: 0,
      owner: [(teamMembers[0]._id as any).toString()],
      remarks: "Test quotation creation"
    };

    console.log('📝 Test Payload:', JSON.stringify(testPayload1, null, 2));

    try {
      const newQuotation = new Quotation({
        ...testPayload1,
        businessId: business._id,
        travelDate: new Date(testPayload1.travelDate)
      });
      
      await newQuotation.save();
      console.log('✅ Quotation created successfully:', newQuotation.customId);
      console.log('   Total Amount:', newQuotation.totalAmount);
      console.log('   Customer:', customers[0].name);
      console.log('   Owner:', teamMembers[0].name);
      
    } catch (error: any) {
      console.log('❌ Error creating quotation:', error.message);
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          console.log(`   - ${key}: ${error.errors[key].message}`);
        });
      }
    }

    // Test Case 2: Valid B2B Quotation (if vendor available)
    if (vendors.length > 0) {
      console.log('\n🧪 Test Case 2: Valid B2B Quotation');
      
      const testPayload2 = {
        quotationType: "hotel",
        channel: "B2B",
        formFields: {
          propertyName: "Grand Hotel",
          checkindate: "2024-12-25",
          checkoutdate: "2024-12-27",
          pax: 2,
          mealPlan: "EPAI"
        },
        totalAmount: 25000,
        status: "draft",
        travelDate: "2024-12-25",
        vendorId: (vendors[0]._id as any).toString(),
        travelers: travellers.length > 1 ? [(travellers[1]._id as any).toString()] : [],
        adultTravlers: 2,
        childTravlers: 0,
        owner: teamMembers.length > 1 ? [(teamMembers[1]._id as any).toString()] : [(teamMembers[0]._id as any).toString()],
        remarks: "Test B2B quotation"
      };

      try {
        const newQuotation2 = new Quotation({
          ...testPayload2,
          businessId: business._id,
          travelDate: new Date(testPayload2.travelDate)
        });
        
        await newQuotation2.save();
        console.log('✅ B2B Quotation created successfully:', newQuotation2.customId);
        console.log('   Total Amount:', newQuotation2.totalAmount);
        console.log('   Vendor:', vendors[0].companyName);
        
      } catch (error: any) {
        console.log('❌ Error creating B2B quotation:', error.message);
        if (error.errors) {
          Object.keys(error.errors).forEach(key => {
            console.log(`   - ${key}: ${error.errors[key].message}`);
          });
        }
      }
    }

    // Test Case 3: Invalid Payload (missing required fields)
    console.log('\n🧪 Test Case 3: Invalid Payload (missing required fields)');
    
    const invalidPayload = {
      quotationType: "flight",
      // Missing channel, formFields, totalAmount, owner, travelDate
      customerId: (customers[0]._id as any).toString()
    };

    try {
      const invalidQuotation = new Quotation({
        ...invalidPayload,
        businessId: business._id
      });
      
      await invalidQuotation.save();
      console.log('❌ Invalid quotation should not have been created');
      
    } catch (error: any) {
      console.log('✅ Validation correctly rejected invalid payload:', error.message);
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          console.log(`   - ${key}: ${error.errors[key].message}`);
        });
      }
    }

    // Summary
    console.log('\n📊 Test Summary:');
    const totalQuotations = await Quotation.countDocuments({ businessId: business._id });
    console.log(`   Total quotations in business: ${totalQuotations}`);
    
    const recentQuotations = await Quotation.find({ businessId: business._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('customerId', 'name')
      .populate('vendorId', 'companyName')
      .populate('owner', 'name');
    
    console.log('\n📝 Recent Quotations:');
    recentQuotations.forEach((q, index) => {
      const customerName = q.customerId ? (q.customerId as any).name : 'N/A';
      const vendorName = q.vendorId ? (q.vendorId as any).companyName : 'N/A';
      const ownerNames = q.owner.map((o: any) => o.name).join(', ');
      console.log(`   ${index + 1}. ${q.customId} - ${q.quotationType} - ${q.channel} - ₹${q.totalAmount}`);
      console.log(`      Customer: ${customerName}, Vendor: ${vendorName}, Owner: ${ownerNames}`);
    });
    
    console.log('\n✅ Create quotation testing completed!');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error testing create quotation:', error);
    await mongoose.disconnect();
  }
};

testCreateQuotationFix();
