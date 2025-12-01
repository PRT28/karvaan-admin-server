#!/usr/bin/env ts-node

/**
 * Test script to verify Swagger documentation completeness
 * This script checks if all schemas and endpoints are properly documented
 */

import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';

// Import swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cooncierge Admin API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Cooncierge Admin Server',
    },
  },
  apis: [
    './routes/*.ts',
    './swagger.ts'
  ],
};

async function testSwaggerDocumentation() {
  console.log('🔍 Testing Swagger Documentation Completeness...\n');

  try {
    // Generate swagger specification
    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    
    console.log('✅ Swagger specification generated successfully');
    console.log(`📊 Total schemas defined: ${Object.keys(swaggerSpec.components?.schemas || {}).length}`);
    console.log(`🛣️  Total paths documented: ${Object.keys(swaggerSpec.paths || {}).length}\n`);

    // Check for required schemas
    const requiredSchemas = [
      'User', 'Business', 'Customer', 'Vendor', 'Team', 'Quotation', 
      'Logs', 'Traveller', 'SuccessResponse', 'ErrorResponse',
      'Pagination', 'BulkUploadResponse', 'DashboardResponse',
      'BookingHistoryResponse', 'LoginRequest', 'LoginResponse'
    ];

    console.log('🔍 Checking required schemas:');
    const schemas = swaggerSpec.components?.schemas || {};
    
    for (const schema of requiredSchemas) {
      if (schemas[schema]) {
        console.log(`  ✅ ${schema} - Found`);
      } else {
        console.log(`  ❌ ${schema} - Missing`);
      }
    }

    // Check for security schemes
    console.log('\n🔒 Checking security schemes:');
    const securitySchemes = swaggerSpec.components?.securitySchemes || {};
    
    if (securitySchemes.bearerAuth) {
      console.log('  ✅ bearerAuth - Found');
    } else {
      console.log('  ❌ bearerAuth - Missing');
    }
    
    if (securitySchemes.karvaanToken) {
      console.log('  ✅ karvaanToken - Found');
    } else {
      console.log('  ❌ karvaanToken - Missing');
    }

    // Check for documented endpoints
    console.log('\n🛣️  Checking documented endpoints:');
    const paths = swaggerSpec.paths || {};
    const pathCount = Object.keys(paths).length;
    
    if (pathCount > 0) {
      console.log(`  ✅ ${pathCount} endpoints documented`);
      
      // Sample some key endpoints
      const keyEndpoints = [
        '/auth/login',
        '/business/register',
        '/customer/get-all-customers',
        '/customer/bulk-upload',
        '/quotation/get-all-quotations',
        '/quotation/booking-history/customer/{customerId}',
        '/traveller/get-all-travellers',
        '/logs/get-all-logs'
      ];
      
      console.log('\n  Key endpoints:');
      for (const endpoint of keyEndpoints) {
        if (paths[endpoint]) {
          console.log(`    ✅ ${endpoint}`);
        } else {
          console.log(`    ❌ ${endpoint} - Not found`);
        }
      }
    } else {
      console.log('  ❌ No endpoints documented');
    }

    // Save the generated spec for inspection
    const outputPath = path.join(__dirname, 'generated-swagger-spec.json');
    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
    console.log(`\n📄 Full swagger specification saved to: ${outputPath}`);

    console.log('\n🎉 Swagger documentation test completed!');
    
  } catch (error) {
    console.error('❌ Error testing swagger documentation:', error);
    process.exit(1);
  }
}

// Run the test
testSwaggerDocumentation();
