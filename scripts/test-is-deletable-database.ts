#!/usr/bin/env ts-node

/**
 * Script to test the isDeletable functionality directly with database queries
 * This simulates what the controllers do to add the isDeletable field
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
import '../models/Logs';

// Now import the models for use
import Business from '../models/Business';
import Customer from '../models/Customer';
import Vendors from '../models/Vendors';
import Team from '../models/Team';
import Traveller from '../models/Traveller';
import Quotation from '../models/Quotation';
import Logs from '../models/Logs';

configDotenv();

const testIsDeletableDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    console.log('🧪 Testing isDeletable Database Logic...\n');
    
    // Get the test business
    const business = await Business.findOne({ businessName: 'Test Travel Agency 2' });
    if (!business) {
      console.log('❌ Test business not found');
      return;
    }
    
    console.log(`🏢 Testing with Business: ${business.businessName}\n`);

    // Test 1: Customers
    console.log('1️⃣ Testing Customers isDeletable Logic...');
    const customers = await Customer.find({ businessId: business._id });
    
    for (const customer of customers) {
      const quotationCount = await Quotation.countDocuments({ 
        customerId: customer._id,
        businessId: customer.businessId 
      });
      
      const isDeletable = quotationCount === 0;
      console.log(`   ${customer.name}: ${quotationCount} quotations → isDeletable: ${isDeletable}`);
    }
    
    // Test 2: Vendors
    console.log('\n2️⃣ Testing Vendors isDeletable Logic...');
    const vendors = await Vendors.find({ businessId: business._id });
    
    for (const vendor of vendors) {
      const quotationCount = await Quotation.countDocuments({ 
        vendorId: vendor._id,
        businessId: vendor.businessId 
      });
      
      const isDeletable = quotationCount === 0;
      console.log(`   ${vendor.companyName}: ${quotationCount} quotations → isDeletable: ${isDeletable}`);
    }
    
    // Test 3: Travellers
    console.log('\n3️⃣ Testing Travellers isDeletable Logic...');
    const travellers = await Traveller.find({ businessId: business._id });
    
    for (const traveller of travellers) {
      const quotationCount = await Quotation.countDocuments({ 
        travelers: traveller._id,
        businessId: traveller.businessId 
      });
      
      const isDeletable = quotationCount === 0;
      console.log(`   ${traveller.name}: ${quotationCount} quotations → isDeletable: ${isDeletable}`);
    }
    
    // Test 4: Team Members
    console.log('\n4️⃣ Testing Team Members isDeletable Logic...');
    const teams = await Team.find({ businessId: business._id });
    
    for (const team of teams) {
      const quotationCount = await Quotation.countDocuments({ 
        owner: team._id,
        businessId: team.businessId 
      });
      
      const logCount = await Logs.countDocuments({
        $or: [
          { userId: team._id },
          { assignedBy: team._id },
          { assignedTo: team._id }
        ],
        businessId: team.businessId
      });
      
      const isDeletable = quotationCount === 0 && logCount === 0;
      console.log(`   ${team.name}: ${quotationCount} quotations, ${logCount} logs → isDeletable: ${isDeletable}`);
    }
    
    // Summary
    console.log('\n📊 Summary:');
    const totalCustomers = customers.length;
    const deletableCustomers = await Promise.all(
      customers.map(async (c) => {
        const count = await Quotation.countDocuments({ customerId: c._id, businessId: c.businessId });
        return count === 0;
      })
    );
    const deletableCustomerCount = deletableCustomers.filter(Boolean).length;
    
    const totalVendors = vendors.length;
    const deletableVendors = await Promise.all(
      vendors.map(async (v) => {
        const count = await Quotation.countDocuments({ vendorId: v._id, businessId: v.businessId });
        return count === 0;
      })
    );
    const deletableVendorCount = deletableVendors.filter(Boolean).length;
    
    const totalTravellers = travellers.length;
    const deletableTravellers = await Promise.all(
      travellers.map(async (t) => {
        const count = await Quotation.countDocuments({ travelers: t._id, businessId: t.businessId });
        return count === 0;
      })
    );
    const deletableTravellerCount = deletableTravellers.filter(Boolean).length;
    
    const totalTeams = teams.length;
    const deletableTeams = await Promise.all(
      teams.map(async (t) => {
        const qCount = await Quotation.countDocuments({ owner: t._id, businessId: t.businessId });
        const lCount = await Logs.countDocuments({
          $or: [{ userId: t._id }, { assignedBy: t._id }, { assignedTo: t._id }],
          businessId: t.businessId
        });
        return qCount === 0 && lCount === 0;
      })
    );
    const deletableTeamCount = deletableTeams.filter(Boolean).length;
    
    console.log(`Customers: ${deletableCustomerCount}/${totalCustomers} deletable`);
    console.log(`Vendors: ${deletableVendorCount}/${totalVendors} deletable`);
    console.log(`Travellers: ${deletableTravellerCount}/${totalTravellers} deletable`);
    console.log(`Team Members: ${deletableTeamCount}/${totalTeams} deletable`);
    
    console.log('\n✅ isDeletable database logic testing completed!');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error testing isDeletable database logic:', error);
    await mongoose.disconnect();
  }
};

testIsDeletableDatabase();
