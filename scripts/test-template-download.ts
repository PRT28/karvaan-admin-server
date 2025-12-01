import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Simulate the template generation logic
const getTemplateData = () => {
  return [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      ownerId: '507f1f77bcf86cd799439011',
      alias: 'Johnny',
      dateOfBirth: '1990-05-15',
      gstin: '22AAAAA0000A1Z5',
      companyName: 'Doe Enterprises',
      openingBalance: 1000,
      balanceType: 'credit',
      address: '123 Main St, City, State',
      tier: 'tier1'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      ownerId: '507f1f77bcf86cd799439012',
      alias: '',
      dateOfBirth: '',
      gstin: '',
      companyName: 'Smith Corp',
      openingBalance: 2500,
      balanceType: 'debit',
      address: '456 Oak Ave, Town, State',
      tier: 'tier2'
    }
  ];
};

const testTemplateGeneration = async () => {
  try {
    console.log('🧪 Testing template generation functionality...\n');
    
    const templateData = getTemplateData();
    const outputDir = path.join(__dirname, 'generated-templates');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Test CSV template generation
    console.log('📄 Generating CSV template...');
    const headers = [
      'name', 'email', 'phone', 'ownerId', 'alias', 'dateOfBirth', 
      'gstin', 'companyName', 'openingBalance', 'balanceType', 'address', 'tier'
    ];
    
    // Create CSV header row
    let csvContent = headers.join(',') + '\n';
    
    // Add sample data rows
    templateData.forEach(row => {
      const csvRow = headers.map(header => {
        const value = (row as any)[header] || '';
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
      csvContent += csvRow + '\n';
    });
    
    const csvPath = path.join(outputDir, 'customer-bulk-upload-template.csv');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`✅ CSV template created: ${csvPath}`);
    
    // Test XLSX template generation
    console.log('\n📊 Generating XLSX template...');
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // name
      { wch: 25 }, // email
      { wch: 15 }, // phone
      { wch: 25 }, // ownerId
      { wch: 10 }, // alias
      { wch: 12 }, // dateOfBirth
      { wch: 15 }, // gstin
      { wch: 20 }, // companyName
      { wch: 15 }, // openingBalance
      { wch: 12 }, // balanceType
      { wch: 30 }, // address
      { wch: 8 }   // tier
    ];
    worksheet['!cols'] = columnWidths;
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Template');
    
    const xlsxPath = path.join(outputDir, 'customer-bulk-upload-template.xlsx');
    XLSX.writeFile(workbook, xlsxPath);
    console.log(`✅ XLSX template created: ${xlsxPath}`);
    
    // Verify file contents
    console.log('\n🔍 Verifying generated templates...');
    
    // Verify CSV
    const csvStats = fs.statSync(csvPath);
    console.log(`CSV file size: ${csvStats.size} bytes`);
    
    const csvLines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(line => line.trim());
    console.log(`CSV lines: ${csvLines.length} (1 header + ${csvLines.length - 1} data rows)`);
    console.log(`CSV headers: ${csvLines[0]}`);
    
    // Verify XLSX
    const xlsxStats = fs.statSync(xlsxPath);
    console.log(`\nXLSX file size: ${xlsxStats.size} bytes`);
    
    // Read back XLSX to verify
    const readWorkbook = XLSX.readFile(xlsxPath);
    const readWorksheet = readWorkbook.Sheets['Customer Template'];
    const readData = XLSX.utils.sheet_to_json(readWorksheet);
    console.log(`XLSX rows: ${readData.length} data rows`);
    console.log(`XLSX columns: ${Object.keys(readData[0] || {}).length}`);
    
    console.log('\n📋 Template Content Preview:');
    console.log('First row data:', JSON.stringify(readData[0], null, 2));
    
    console.log('\n✅ Template generation test completed successfully!');
    console.log('\n📁 Generated files:');
    console.log(`- CSV: ${csvPath}`);
    console.log(`- XLSX: ${xlsxPath}`);
    
    console.log('\n🚀 To test the template download API:');
    console.log('1. Start your server');
    console.log('2. Test the endpoints:');
    console.log('');
    console.log('Download CSV template:');
    console.log('curl -X GET http://localhost:8080/customer/bulk-upload-template/csv \\');
    console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('  -o downloaded-template.csv');
    console.log('');
    console.log('Download XLSX template:');
    console.log('curl -X GET http://localhost:8080/customer/bulk-upload-template/xlsx \\');
    console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('  -o downloaded-template.xlsx');
    console.log('');
    console.log('Expected results:');
    console.log('- Files should download with proper headers');
    console.log('- CSV should contain comma-separated values');
    console.log('- XLSX should be a valid Excel file');
    console.log('- Both should contain sample data for reference');
    
  } catch (error) {
    console.error('❌ Error during template generation test:', error);
  }
};

testTemplateGeneration();
