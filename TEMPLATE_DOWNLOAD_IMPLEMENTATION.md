# Template Download API Implementation

## Overview

This implementation provides a template download API that generates properly formatted CSV and XLSX files for bulk customer upload. Users can download these templates, fill them with their customer data, and upload them using the bulk upload API.

## 🚀 **Features Implemented**

### **1. Template Generation**
- **CSV Templates**: Comma-separated values with proper escaping
- **XLSX Templates**: Microsoft Excel format with column formatting
- **Sample Data**: Includes example records showing proper data format
- **All Columns**: Contains both required and optional fields

### **2. File Format Support**
- **CSV Format**: Standard comma-separated values
- **XLSX Format**: Excel format with column width optimization
- **Proper Headers**: Content-Type and Content-Disposition headers
- **File Download**: Direct browser download with proper filename

### **3. Data Structure**
- **Required Fields**: name, email, phone, ownerId
- **Optional Fields**: alias, dateOfBirth, gstin, companyName, openingBalance, balanceType, address, tier
- **Sample Values**: Realistic example data for guidance
- **Format Examples**: Shows proper date formats, tier values, etc.

## 📋 **API Endpoint**

```
GET /customer/bulk-upload-template/{format}
```

### **Parameters**
- **format** (path parameter): File format - either `csv` or `xlsx`

### **Headers**
```
Authorization: Bearer <your-jwt-token>
```

## 📊 **Template Structure**

### **Column Headers**
| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| name | string | ✅ | Customer full name | "John Doe" |
| email | string | ✅ | Valid email address | "john@example.com" |
| phone | string | ✅ | Phone number | "+1234567890" |
| ownerId | string | ✅ | Team member ObjectId | "507f1f77bcf86cd799439011" |
| alias | string | ❌ | Customer nickname | "Johnny" |
| dateOfBirth | date | ❌ | Birth date (YYYY-MM-DD) | "1990-05-15" |
| gstin | string | ❌ | GST identification | "22AAAAA0000A1Z5" |
| companyName | string | ❌ | Company name | "Doe Enterprises" |
| openingBalance | number | ❌ | Opening balance | 1000 |
| balanceType | string | ❌ | credit or debit | "credit" |
| address | string | ❌ | Customer address | "123 Main St" |
| tier | string | ❌ | tier1-tier5 | "tier1" |

### **Sample Data Included**
The template includes 2 sample rows with realistic data:
1. **Complete Record**: Shows all fields filled with example values
2. **Minimal Record**: Shows only required fields plus some optional ones

## 📤 **Response Format**

### **Success Response (200)**
- **Content-Type**: `text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition**: `attachment; filename="customer-bulk-upload-template.{format}"`
- **Body**: Binary file content

### **Error Response (400)**
```json
{
  "success": false,
  "message": "Invalid format. Supported formats are: csv, xlsx"
}
```

## 🔧 **Implementation Details**

### **Files Modified**

1. **`controllers/customer.ts`**
   - Added `downloadBulkUploadTemplate` function
   - Added `getTemplateData` helper function
   - CSV generation with proper escaping
   - XLSX generation with column formatting

2. **`routes/customer.ts`**
   - Added template download route
   - Comprehensive Swagger documentation
   - Parameter validation

### **Key Functions**

- **`getTemplateData()`**: Generates sample data for templates
- **`downloadBulkUploadTemplate()`**: Main controller function
- **CSV Generation**: Creates properly formatted CSV with escaping
- **XLSX Generation**: Creates Excel file with column widths

## 🧪 **Testing**

### **Test Script**
Run the test script to verify template generation:
```bash
npm run test-template-download
```

This creates sample templates in `scripts/generated-templates/` directory.

### **Manual Testing**
```bash
# Download CSV template
curl -X GET http://localhost:8080/customer/bulk-upload-template/csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o template.csv

# Download XLSX template
curl -X GET http://localhost:8080/customer/bulk-upload-template/xlsx \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o template.xlsx
```

## ✅ **Usage Workflow**

### **Step 1: Download Template**
```bash
GET /customer/bulk-upload-template/csv
# or
GET /customer/bulk-upload-template/xlsx
```

### **Step 2: Fill Template**
1. Open downloaded template file
2. Replace sample data with your customer information
3. Ensure required fields are filled
4. Use proper formats for dates, tiers, etc.
5. Replace sample ownerId values with actual team member IDs

### **Step 3: Upload Completed File**
```bash
POST /customer/bulk-upload
Content-Type: multipart/form-data
Body: file=@completed-template.csv
```

## 🛡️ **Data Validation Notes**

### **Important Guidelines for Users**
- **ownerId**: Must be valid ObjectId of team member from your business
- **email**: Must be unique within your business
- **tier**: Use only tier1, tier2, tier3, tier4, tier5
- **balanceType**: Use only 'credit' or 'debit'
- **dateOfBirth**: Use YYYY-MM-DD format
- **Required Fields**: name, email, phone, ownerId must not be empty

### **CSV Specific Notes**
- Values containing commas are automatically quoted
- Quotes within values are escaped as double quotes
- Empty optional fields are left blank

### **XLSX Specific Notes**
- Column widths are optimized for readability
- Numeric values are stored as numbers (not text)
- Date values maintain proper formatting

## 📈 **Benefits**

- **User-Friendly**: Provides clear template with examples
- **Error Prevention**: Shows proper data formats
- **Consistency**: Ensures uploaded data matches expected structure
- **Efficiency**: Users can quickly understand required format
- **Flexibility**: Supports both CSV and Excel preferences

The template download API is now fully functional and provides users with properly formatted templates for bulk customer data upload!
