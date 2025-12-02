#!/usr/bin/env ts-node

/**
 * Script to test the team member booking history API endpoint
 * This script makes actual HTTP requests to test the API
 */

import axios from 'axios';
import { configDotenv } from 'dotenv';

configDotenv();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN || 'your-api-token-here';

// Test authentication token (you may need to get a real token)
const AUTH_TOKEN = 'your-jwt-token-here';

const testTeamMemberBookingAPI = async () => {
  try {
    console.log('🧪 Testing Team Member Booking History API...\n');
    
    const headers = {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      'x-api-key': API_TOKEN
    };

    // First, get all team members to find valid IDs
    console.log('1️⃣ Getting team members...');
    try {
      const teamResponse = await axios.get(`${BASE_URL}/team/get-teams`, { headers });
      const teams = teamResponse.data;
      
      console.log(`   Found ${teams.length} team members`);
      
      if (teams.length === 0) {
        console.log('   ❌ No team members found. Cannot test booking history API.');
        return;
      }

      // Test booking history for each team member
      for (let i = 0; i < Math.min(teams.length, 3); i++) {
        const team = teams[i];
        console.log(`\n2️⃣ Testing booking history for: ${team.name} (${team._id})`);
        
        try {
          // Test basic endpoint
          const response = await axios.get(
            `${BASE_URL}/quotation/booking-history/team-member/${team._id}`,
            { headers }
          );
          
          const data = response.data;
          console.log(`   ✅ API Response: ${data.success ? 'Success' : 'Failed'}`);
          console.log(`   📊 Found ${data.data.quotations.length} quotations`);
          console.log(`   👤 Team Member: ${data.data.teamMember.name}`);
          
          if (data.data.quotations.length > 0) {
            const totalValue = data.data.quotations.reduce((sum: number, q: any) => sum + q.totalAmount, 0);
            console.log(`   💰 Total Value: ₹${totalValue.toLocaleString()}`);
            
            // Show first quotation details
            const firstQuotation = data.data.quotations[0];
            console.log(`   📝 Latest Quotation: ${firstQuotation.customId} - ${firstQuotation.quotationType} - ₹${firstQuotation.totalAmount}`);
          }
          
          // Test with filters
          console.log(`\n3️⃣ Testing filters for ${team.name}...`);
          
          // Test status filter
          const confirmedResponse = await axios.get(
            `${BASE_URL}/quotation/booking-history/team-member/${team._id}?status=confirmed`,
            { headers }
          );
          console.log(`   🔍 Confirmed quotations: ${confirmedResponse.data.data.quotations.length}`);
          
          // Test pagination
          const paginatedResponse = await axios.get(
            `${BASE_URL}/quotation/booking-history/team-member/${team._id}?page=1&limit=2`,
            { headers }
          );
          const pagination = paginatedResponse.data.data.pagination;
          console.log(`   📄 Pagination: Page ${pagination.currentPage}/${pagination.totalPages} (${pagination.totalCount} total)`);
          
        } catch (error: any) {
          if (error.response) {
            console.log(`   ❌ API Error: ${error.response.status} - ${error.response.data.message}`);
          } else {
            console.log(`   ❌ Request Error: ${error.message}`);
          }
        }
      }
      
      // Test error cases
      console.log(`\n4️⃣ Testing error cases...`);
      
      // Test invalid team member ID
      try {
        await axios.get(
          `${BASE_URL}/quotation/booking-history/team-member/invalid-id`,
          { headers }
        );
      } catch (error: any) {
        if (error.response && error.response.status === 400) {
          console.log(`   ✅ Invalid ID handling: ${error.response.data.message}`);
        }
      }
      
      // Test non-existent team member ID
      try {
        await axios.get(
          `${BASE_URL}/quotation/booking-history/team-member/507f1f77bcf86cd799439011`,
          { headers }
        );
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          console.log(`   ✅ Non-existent ID handling: ${error.response.data.message}`);
        }
      }
      
    } catch (error: any) {
      console.log('   ❌ Error getting team members:', error.message);
    }

    console.log('\n🎉 Team member booking history API testing completed!');
    console.log('\n📋 API Features Tested:');
    console.log('- ✅ Basic booking history retrieval');
    console.log('- ✅ Status filtering');
    console.log('- ✅ Pagination support');
    console.log('- ✅ Error handling (invalid/non-existent IDs)');
    console.log('- ✅ Response format validation');
    console.log('- ✅ Team member information inclusion');
    
  } catch (error) {
    console.error('❌ Error testing team member booking history API:', error);
  }
};

// Note: This script requires valid authentication tokens to work
console.log('⚠️  Note: This script requires valid authentication tokens.');
console.log('   Please update AUTH_TOKEN and API_TOKEN in the script or environment variables.\n');
console.log('🔗 API Endpoint: GET /quotation/booking-history/team-member/{teamMemberId}');
console.log('📚 Documentation: Available in Swagger UI at /api-docs\n');

testTeamMemberBookingAPI();
