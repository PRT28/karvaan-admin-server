#!/usr/bin/env ts-node

/**
 * Script to test the isDeletable functionality for customers, vendors, travellers, and team members
 * This script will make API calls to test the new isDeletable field
 */

import axios from 'axios';
import { configDotenv } from 'dotenv';

configDotenv();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN || 'your-api-token-here';

// Test authentication token (you may need to get a real token)
const AUTH_TOKEN = 'your-jwt-token-here';

const testIsDeletableFunctionality = async () => {
  try {
    console.log('🧪 Testing isDeletable Functionality...\n');
    
    const headers = {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      'x-api-key': API_TOKEN
    };

    // Test 1: Get Customers
    console.log('1️⃣ Testing Customers isDeletable...');
    try {
      const customersResponse = await axios.get(`${BASE_URL}/customer/get-customers`, { headers });
      const customers = customersResponse.data.customers;
      
      console.log(`   Found ${customers.length} customers`);
      customers.forEach((customer: any, index: number) => {
        console.log(`   ${index + 1}. ${customer.name} - isDeletable: ${customer.isDeletable}`);
      });
      
      const deletableCustomers = customers.filter((c: any) => c.isDeletable);
      const nonDeletableCustomers = customers.filter((c: any) => !c.isDeletable);
      console.log(`   ✅ Deletable: ${deletableCustomers.length}, Non-deletable: ${nonDeletableCustomers.length}\n`);
      
    } catch (error) {
      console.log('   ❌ Error testing customers:', (error as any).message);
    }

    // Test 2: Get Vendors
    console.log('2️⃣ Testing Vendors isDeletable...');
    try {
      const vendorsResponse = await axios.get(`${BASE_URL}/vendor/get-vendors`, { headers });
      const vendors = vendorsResponse.data.vendors;
      
      console.log(`   Found ${vendors.length} vendors`);
      vendors.forEach((vendor: any, index: number) => {
        console.log(`   ${index + 1}. ${vendor.companyName} - isDeletable: ${vendor.isDeletable}`);
      });
      
      const deletableVendors = vendors.filter((v: any) => v.isDeletable);
      const nonDeletableVendors = vendors.filter((v: any) => !v.isDeletable);
      console.log(`   ✅ Deletable: ${deletableVendors.length}, Non-deletable: ${nonDeletableVendors.length}\n`);
      
    } catch (error) {
      console.log('   ❌ Error testing vendors:', (error as any).message);
    }

    // Test 3: Get Travellers
    console.log('3️⃣ Testing Travellers isDeletable...');
    try {
      const travellersResponse = await axios.get(`${BASE_URL}/traveller/get-travellers`, { headers });
      const travellers = travellersResponse.data.travellers;
      
      console.log(`   Found ${travellers.length} travellers`);
      travellers.forEach((traveller: any, index: number) => {
        console.log(`   ${index + 1}. ${traveller.name} - isDeletable: ${traveller.isDeletable}`);
      });
      
      const deletableTravellers = travellers.filter((t: any) => t.isDeletable);
      const nonDeletableTravellers = travellers.filter((t: any) => !t.isDeletable);
      console.log(`   ✅ Deletable: ${deletableTravellers.length}, Non-deletable: ${nonDeletableTravellers.length}\n`);
      
    } catch (error) {
      console.log('   ❌ Error testing travellers:', (error as any).message);
    }

    // Test 4: Get Team Members
    console.log('4️⃣ Testing Team Members isDeletable...');
    try {
      const teamResponse = await axios.get(`${BASE_URL}/team/get-teams`, { headers });
      const teams = teamResponse.data;
      
      console.log(`   Found ${teams.length} team members`);
      teams.forEach((team: any, index: number) => {
        console.log(`   ${index + 1}. ${team.name} - isDeletable: ${team.isDeletable}`);
      });
      
      const deletableTeams = teams.filter((t: any) => t.isDeletable);
      const nonDeletableTeams = teams.filter((t: any) => !t.isDeletable);
      console.log(`   ✅ Deletable: ${deletableTeams.length}, Non-deletable: ${nonDeletableTeams.length}\n`);
      
    } catch (error) {
      console.log('   ❌ Error testing team members:', (error as any).message);
    }

    console.log('🎉 isDeletable functionality testing completed!');
    console.log('\n📋 Summary:');
    console.log('- Customers: isDeletable = false if referenced in quotations');
    console.log('- Vendors: isDeletable = false if referenced in quotations');
    console.log('- Travellers: isDeletable = false if referenced in quotations');
    console.log('- Team Members: isDeletable = false if referenced in quotations or logs');
    
  } catch (error) {
    console.error('❌ Error testing isDeletable functionality:', error);
  }
};

// Note: This script requires valid authentication tokens to work
// You may need to update the AUTH_TOKEN and API_TOKEN values
console.log('⚠️  Note: This script requires valid authentication tokens.');
console.log('   Please update AUTH_TOKEN and API_TOKEN in the script or environment variables.\n');

testIsDeletableFunctionality();
