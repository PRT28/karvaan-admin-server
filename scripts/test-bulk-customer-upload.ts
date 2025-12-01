import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Customer from '../models/Customer';
import Business from '../models/Business';
import Team from '../models/Team';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

configDotenv();

const createTestFiles = async () => {
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
    console.log(`Using team member: ${teamMember.name} (${teamMember._id})`);
    
    // Create test data
    const testCustomers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        ownerId: (teamMember._id as any).toString(),
        alias: 'Johnny',
        companyName: 'Doe Enterprises',
        tier: 'tier1',
        address: '123 Main St, City, State',
        openingBalance: 1000,
        balanceType: 'credit'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        ownerId: (teamMember._id as any).toString(),
        tier: 'tier2',
        gstin: '22AAAAA0000A1Z5',
        dateOfBirth: '1990-05-15'
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1234567892',
        ownerId: (teamMember._id as any).toString(),
        companyName: 'Johnson & Co',
        tier: 'tier3',
        openingBalance: 2500,
        balanceType: 'debit'
      },
      {
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        phone: '+1234567893',
        ownerId: (teamMember._id as any).toString(),
        alias: 'Ali',
        tier: 'tier1',
        address: '456 Oak Ave, Town, State'
      },
      {
        name: 'Invalid Customer', // This should fail - missing required fields
        email: '', // Empty email
        phone: '+1234567894',
        ownerId: (teamMember._id as any).toString()
      },
      {
        name: 'Another Invalid',
        email: 'invalid.customer@example.com',
        phone: '+1234567895',
        ownerId: 'invalid-object-id' // Invalid ObjectId
      }
    ];
    
    // Create CSV file
    const csvHeader = 'name,email,phone,ownerId,alias,companyName,tier,address,openingBalance,balanceType,gstin,dateOfBirth\n';
    const csvRows = testCustomers.map(customer => {
      return [
        customer.name || '',
        customer.email || '',
        customer.phone || '',
        customer.ownerId || '',
        (customer as any).alias || '',
        (customer as any).companyName || '',
        (customer as any).tier || '',
        (customer as any).address || '',
        (customer as any).openingBalance || '',
        (customer as any).balanceType || '',
        (customer as any).gstin || '',
        (customer as any).dateOfBirth || ''
      ].map(field => `"${field}"`).join(',');
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    const csvPath = path.join(__dirname, 'test-customers.csv');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`✅ Created CSV test file: ${csvPath}`);
    
    // Create XLSX file
    const worksheet = XLSX.utils.json_to_sheet(testCustomers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    const xlsxPath = path.join(__dirname, 'test-customers.xlsx');
    XLSX.writeFile(workbook, xlsxPath);
    console.log(`✅ Created XLSX test file: ${xlsxPath}`);
    
    // Clean up existing test customers to avoid duplicates
    await Customer.deleteMany({ 
      email: { $in: testCustomers.map(c => c.email).filter(email => email) },
      businessId: business._id 
    });
    console.log('🧹 Cleaned up existing test customers');
    
    console.log('\n📋 Test Data Summary:');
    console.log(`Total records: ${testCustomers.length}`);
    console.log(`Valid records: ${testCustomers.filter(c => c.name && c.email && c.phone && mongoose.Types.ObjectId.isValid(c.ownerId)).length}`);
    console.log(`Invalid records: ${testCustomers.filter(c => !c.name || !c.email || !c.phone || !mongoose.Types.ObjectId.isValid(c.ownerId)).length}`);
    
    console.log('\n🧪 To test the bulk upload API:');
    console.log('1. Start your server');
    console.log('2. Use a tool like Postman or curl to upload the files:');
    console.log('');
    console.log('For CSV:');
    console.log(`curl -X POST http://localhost:8080/customer/bulk-upload \\`);
    console.log(`  -H "Authorization: Bearer YOUR_TOKEN" \\`);
    console.log(`  -F "file=@${csvPath}"`);
    console.log('');
    console.log('For XLSX:');
    console.log(`curl -X POST http://localhost:8080/customer/bulk-upload \\`);
    console.log(`  -H "Authorization: Bearer YOUR_TOKEN" \\`);
    console.log(`  -F "file=@${xlsxPath}"`);
    console.log('');
    console.log('Expected results:');
    console.log('- 4 customers should be created successfully');
    console.log('- 2 customers should fail (empty email and invalid ownerId)');
    console.log('- Response should include detailed error information');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error creating test files:', error);
    await mongoose.disconnect();
  }
};

createTestFiles();
