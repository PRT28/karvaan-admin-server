# Booking History API Implementation

## Overview

This implementation provides comprehensive booking history APIs that allow retrieving quotations (bookings) based on customer, vendor, and traveller associations. The APIs include advanced filtering, pagination, sorting, and business-based access control.

## 🚀 Features Implemented

### 1. **Three Booking History Endpoints**
- **Customer Booking History**: `GET /quotation/booking-history/customer/{customerId}`
- **Vendor Booking History**: `GET /quotation/booking-history/vendor/{vendorId}`
- **Traveller Booking History**: `GET /quotation/booking-history/traveller/{travellerId}`

### 2. **Advanced Filtering Options**
- **Status Filter**: Filter by quotation status (draft, confirmed, cancelled)
- **Quotation Type Filter**: Filter by type (flight, train, hotel, activity, etc.)
- **Booking Date Range**: Filter by creation date (startDate, endDate)
- **Travel Date Range**: Filter by travel date (travelStartDate, travelEndDate)

### 3. **Pagination & Sorting**
- **Pagination**: Configurable page size and navigation
- **Sorting**: Sort by any field with ascending/descending order
- **Metadata**: Total count, page info, navigation flags

### 4. **Data Population**
- **Customer Details**: Name, email, phone, company name
- **Vendor Details**: Company name, contact person, email, phone
- **Traveller Details**: Name, email, phone
- **Owner Details**: Team member name and email
- **Business Details**: Business name

### 5. **Security & Access Control**
- **Business Isolation**: Users can only access data from their business
- **Entity Validation**: Verify customer/vendor/traveller exists and belongs to user's business
- **Comprehensive Error Handling**: Detailed error messages and proper HTTP status codes

## 📁 Files Modified/Created

### Modified Files:
1. **`models/Quotation.ts`**
   - Added indexes for customer, vendor, and traveller queries
   - Fixed travellers field to reference 'Traveller' model instead of 'Customer'

2. **`controllers/quotation.ts`**
   - Added `getBookingHistoryByCustomer()` function
   - Added `getBookingHistoryByVendor()` function  
   - Added `getBookingHistoryByTraveller()` function
   - Imported Traveller model

3. **`routes/quotation.ts`**
   - Added comprehensive Swagger documentation for all three endpoints
   - Added route handlers for booking history endpoints

4. **`package.json`**
   - Added test script: `npm run test-booking-history`

### Created Files:
1. **`scripts/test-booking-history-apis.ts`**
   - Comprehensive test script that creates test data and verifies queries
   - Creates customer, vendor, traveller, and quotation test records
   - Tests all three booking history query patterns

2. **`BOOKING_HISTORY_API_IMPLEMENTATION.md`** (this file)
   - Complete documentation of the implementation

## 🔧 Technical Implementation Details

### Database Indexes Added
```typescript
// Enhanced indexes for better query performance
QuotationSchema.index({ businessId: 1, customerId: 1 });
QuotationSchema.index({ businessId: 1, vendorId: 1 });
QuotationSchema.index({ businessId: 1, travelers: 1 });
```

### Query Patterns

#### Customer Booking History
```typescript
const filter = { 
  customerId: customerId,
  businessId: customer.businessId 
};
```

#### Vendor Booking History
```typescript
const filter = { 
  vendorId: vendorId,
  businessId: vendor.businessId 
};
```

#### Traveller Booking History
```typescript
const filter = { 
  travelers: { $in: [travellerId] },
  businessId: traveller.businessId 
};
```

### Response Format
```json
{
  "success": true,
  "data": {
    "quotations": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 47,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "customer/vendor/traveller": {
      "_id": "...",
      "name": "...",
      "email": "..."
    }
  }
}
```

## 🧪 Testing

### Automated Testing
```bash
# Run the comprehensive test script
npm run test-booking-history
```

The test script will:
1. Create test customer, vendor, and traveller records
2. Create multiple quotations with different associations
3. Test all three booking history query patterns
4. Verify data relationships and filtering

### Manual API Testing

#### 1. Customer Booking History
```bash
GET /quotation/booking-history/customer/{customerId}
?status=confirmed
&quotationType=flight
&startDate=2024-01-01
&endDate=2024-12-31
&page=1
&limit=10
&sortBy=createdAt
&sortOrder=desc
```

#### 2. Vendor Booking History
```bash
GET /quotation/booking-history/vendor/{vendorId}
?status=draft
&travelStartDate=2024-06-01
&travelEndDate=2024-06-30
&page=1
&limit=5
```

#### 3. Traveller Booking History
```bash
GET /quotation/booking-history/traveller/{travellerId}
?quotationType=hotel
&sortBy=totalAmount
&sortOrder=asc
```

## 📊 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quotation/booking-history/customer/{customerId}` | Get all bookings for a specific customer |
| GET | `/quotation/booking-history/vendor/{vendorId}` | Get all bookings for a specific vendor |
| GET | `/quotation/booking-history/traveller/{travellerId}` | Get all bookings where traveller is included |

## 🔒 Security Features

1. **Business-based Access Control**: All queries are filtered by user's business
2. **Entity Ownership Validation**: Verify customer/vendor/traveller belongs to user's business
3. **Input Validation**: ObjectId validation and parameter sanitization
4. **Error Handling**: Comprehensive error responses with appropriate HTTP status codes

## 🎯 Use Cases

1. **Customer Service**: View all bookings for a specific customer
2. **Vendor Management**: Track all bookings with a specific vendor
3. **Traveller Tracking**: See all trips for a specific traveller
4. **Business Analytics**: Filter and analyze booking patterns
5. **Financial Reporting**: Track revenue by customer, vendor, or traveller

## ✅ Implementation Status

- ✅ **Customer Booking History API**: Complete with filtering, pagination, and population
- ✅ **Vendor Booking History API**: Complete with filtering, pagination, and population  
- ✅ **Traveller Booking History API**: Complete with filtering, pagination, and population
- ✅ **Comprehensive Swagger Documentation**: All endpoints fully documented
- ✅ **Business-based Access Control**: Multi-tenant security implemented
- ✅ **Database Optimization**: Proper indexes for query performance
- ✅ **Test Suite**: Comprehensive testing script created
- ✅ **Error Handling**: Robust error handling and validation

The booking history API implementation is now complete and ready for production use!
