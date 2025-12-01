# Bulk Customer Upload API Implementation

## Overview

This implementation provides a comprehensive bulk upload functionality for customer data using CSV or XLSX files. The API accepts file uploads, validates data, and creates multiple customer records while providing detailed feedback on success and failure cases.

## 🚀 **Features Implemented**

### **1. File Upload Support**
- **CSV Files**: Standard comma-separated values format
- **XLSX Files**: Microsoft Excel format (.xls, .xlsx)
- **File Size Limit**: 10MB maximum
- **Memory Processing**: Files are processed in memory for better performance

### **2. Data Validation**
- **Required Fields**: name, email, phone, ownerId
- **Email Validation**: Format validation and business-level uniqueness
- **ObjectId Validation**: Ensures ownerId references valid team members
- **Business Association**: Validates ownerId belongs to user's business
- **Optional Field Validation**: tier, balanceType, dateOfBirth, etc.

### **3. Error Handling**
- **Row-Level Errors**: Detailed error reporting for each failed record
- **Partial Success**: Processes valid records even if some fail
- **Comprehensive Feedback**: Success/failure counts and detailed error messages

### **4. Security & Multi-Tenancy**
- **Business Isolation**: Customers are automatically associated with user's business
- **Owner Validation**: Ensures ownerId belongs to the same business
- **Authentication Required**: Protected by karvaanToken middleware

## 📋 **API Endpoint**

```
POST /customer/bulk-upload
```

### **Headers**
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

### **Request Body**
- **Field Name**: `file`
- **File Types**: CSV (.csv) or Excel (.xls, .xlsx)
- **Max Size**: 10MB

## 📊 **File Format Requirements**

### **Required Columns**
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| name | string | Customer full name | "John Doe" |
| email | string | Valid email address | "john@example.com" |
| phone | string | Phone number | "+1234567890" |
| ownerId | string | Valid ObjectId of team member | "507f1f77bcf86cd799439011" |

### **Optional Columns**
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| alias | string | Customer nickname | "Johnny" |
| dateOfBirth | date | Birth date (YYYY-MM-DD) | "1990-05-15" |
| gstin | string | GST identification | "22AAAAA0000A1Z5" |
| companyName | string | Company name | "Doe Enterprises" |
| openingBalance | number | Opening balance | 1000 |
| balanceType | string | credit or debit | "credit" |
| address | string | Customer address | "123 Main St" |
| tier | string | tier1-tier5 | "tier1" |

## 📤 **Response Format**

### **Success Response (200)**
```json
{
  "success": true,
  "message": "Bulk upload completed. 8 customers created successfully, 2 failed.",
  "totalRecords": 10,
  "successfulRecords": 8,
  "failedRecords": 2,
  "errors": [
    {
      "row": 5,
      "data": { "name": "", "email": "invalid@example.com" },
      "error": "Name is required and must be a non-empty string"
    }
  ],
  "createdCustomers": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "businessId": "507f1f77bcf86cd799439010",
      // ... other customer fields
    }
  ]
}
```

### **Error Response (400)**
```json
{
  "success": false,
  "message": "No file uploaded. Please upload a CSV or XLSX file."
}
```

## 🔧 **Implementation Details**

### **Files Created/Modified**

1. **`controllers/customer.ts`**
   - Added `bulkUploadCustomers` function
   - Added validation helpers
   - Added CSV/XLSX parsing functions

2. **`middleware/upload.ts`** (New)
   - Multer configuration for file uploads
   - File type validation
   - Error handling middleware

3. **`routes/customer.ts`**
   - Added bulk upload route with comprehensive Swagger docs
   - Integrated upload middleware

4. **`package.json`**
   - Added dependencies: multer, csv-parser, xlsx, @types/multer

### **Key Functions**

- **`validateCustomerData()`**: Validates individual customer records
- **`parseCSVData()`**: Parses CSV files using csv-parser
- **`parseXLSXData()`**: Parses Excel files using xlsx library
- **`bulkUploadCustomers()`**: Main controller function

## 🧪 **Testing**

### **Test Script**
Run the test script to create sample files:
```bash
npm run create-bulk-upload-test
```

This creates:
- `scripts/test-customers.csv`
- `scripts/test-customers.xlsx`

### **Manual Testing**
```bash
# Test CSV upload
curl -X POST http://localhost:8080/customer/bulk-upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@scripts/test-customers.csv"

# Test XLSX upload
curl -X POST http://localhost:8080/customer/bulk-upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@scripts/test-customers.xlsx"
```

## ✅ **Validation Rules**

### **Business Rules**
- Email must be unique per business
- OwnerId must exist and belong to the same business
- All customers are automatically associated with user's business

### **Data Type Validation**
- **Email**: Must match email regex pattern
- **ObjectId**: Must be valid MongoDB ObjectId format
- **Tier**: Must be one of tier1, tier2, tier3, tier4, tier5
- **BalanceType**: Must be either 'credit' or 'debit'
- **DateOfBirth**: Must be valid date format
- **OpeningBalance**: Must be a valid number

## 🛡️ **Security Features**

- **File Type Restriction**: Only CSV and XLSX files allowed
- **File Size Limit**: 10MB maximum to prevent abuse
- **Business Isolation**: Users can only create customers for their business
- **Owner Validation**: Prevents assigning customers to team members from other businesses
- **Input Sanitization**: All string inputs are trimmed and validated

## 📈 **Performance Considerations**

- **Memory Processing**: Files processed in memory for speed
- **Batch Operations**: Uses MongoDB's insertMany for efficiency
- **Error Aggregation**: Collects all errors before responding
- **Streaming**: CSV parsing uses streams for memory efficiency

The bulk upload API is now fully functional and ready for production use!
