# Traveller API Implementation

## Overview
Successfully implemented a comprehensive CRUD API for the Traveller model with soft deletion functionality and business-based multi-tenant architecture.

## Features Implemented

### 1. **Traveller Model** (`models/Traveller.ts`)
- **Fields:**
  - `name` (required): Full name of the traveller
  - `email` (optional): Email address
  - `phone` (optional): Phone number
  - `passportNumber` (optional): Passport number (uppercase)
  - `passportExpiry` (optional): Passport expiry date
  - `nationality` (optional): Nationality
  - `dateOfBirth` (optional): Date of birth
  - `gender` (optional): Gender (male/female/other)
  - `address` (optional): Address
  - `emergencyContact` (optional): Emergency contact object with name, phone, relationship
  - `businessId` (required): Reference to Business (multi-tenant)
  - `customerId` (optional): Reference to Customer if associated
  - `isDeleted` (default: false): Soft deletion flag
  - `createdAt`, `updatedAt`: Timestamps

- **Indexes:**
  - Business-based queries optimization
  - Passport number sparse index
  - Soft deletion filtering

### 2. **Controller Functions** (`controllers/traveller.ts`)

#### `getTravellers`
- **Route:** `GET /traveller/get-all-travellers`
- **Features:**
  - Multi-tenant filtering (business-based)
  - `isDeleted` query parameter (true/false)
  - `customerId` query parameter for customer-specific travellers
  - Population of business and customer details
  - Sorted by creation date (newest first)

#### `getTravellerById`
- **Route:** `GET /traveller/get-traveller/:id`
- **Features:**
  - ObjectId validation
  - Business-based access control
  - Population of related data

#### `createTraveller`
- **Route:** `POST /traveller/create-traveller`
- **Features:**
  - Automatic business association
  - Required field validation
  - Population of created record

#### `updateTraveller`
- **Route:** `PUT /traveller/update-traveller/:id`
- **Features:**
  - Business-based access control
  - Prevents businessId modification
  - Validation on update

#### `deleteTraveller`
- **Route:** `DELETE /traveller/delete-traveller/:id`
- **Features:**
  - Soft deletion (sets isDeleted: true)
  - Business-based access control
  - Returns minimal response data

#### `restoreTraveller`
- **Route:** `PATCH /traveller/restore-traveller/:id`
- **Features:**
  - Restores soft-deleted travellers
  - Business-based access control
  - Full population of restored record

### 3. **API Routes** (`routes/traveller.ts`)
- **Complete Swagger documentation** for all endpoints
- **Security:** All routes protected with `karvaanToken` middleware
- **Comprehensive request/response schemas**
- **Error handling documentation**

### 4. **Multi-Tenant Architecture**
- **Business Isolation:** All operations filtered by user's businessId
- **Super Admin Access:** Super admins can access all businesses
- **Security:** Users can only access travellers from their business

## API Endpoints Summary

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/traveller/get-all-travellers` | List all travellers | `isDeleted`, `customerId` |
| GET | `/traveller/get-traveller/:id` | Get traveller by ID | - |
| POST | `/traveller/create-traveller` | Create new traveller | - |
| PUT | `/traveller/update-traveller/:id` | Update traveller | - |
| DELETE | `/traveller/delete-traveller/:id` | Soft delete traveller | - |
| PATCH | `/traveller/restore-traveller/:id` | Restore deleted traveller | - |

## Usage Examples

### 1. **Get Active Travellers**
```bash
GET /traveller/get-all-travellers?isDeleted=false
```

### 2. **Get Deleted Travellers**
```bash
GET /traveller/get-all-travellers?isDeleted=true
```

### 3. **Get Travellers for Specific Customer**
```bash
GET /traveller/get-all-travellers?customerId=60f7b3b3b3b3b3b3b3b3b3b3&isDeleted=false
```

### 4. **Create Traveller**
```json
POST /traveller/create-traveller
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+1-555-0101",
  "passportNumber": "A12345678",
  "passportExpiry": "2030-12-31",
  "nationality": "American",
  "dateOfBirth": "1985-06-15",
  "gender": "male",
  "address": "123 Main St, New York, NY 10001",
  "emergencyContact": {
    "name": "Jane Smith",
    "phone": "+1-555-0102",
    "relationship": "Spouse"
  },
  "customerId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

## Testing
- **Test Script:** `npm run test-traveller-api`
- **Comprehensive testing** of all CRUD operations
- **Filter testing** for isDeleted and customerId
- **Multi-tenant validation**

## Integration
- **Added to main app** (`index.ts`)
- **Protected routes** with authentication middleware
- **Swagger documentation** integrated
- **Database indexes** optimized for performance

## Benefits
1. **Soft Deletion:** Travellers are never permanently deleted, allowing for data recovery
2. **Multi-Tenant:** Complete business isolation for data security
3. **Flexible Filtering:** Easy to get active, deleted, or customer-specific travellers
4. **Comprehensive Documentation:** Full Swagger API documentation
5. **Validation:** Proper input validation and error handling
6. **Performance:** Optimized database indexes for fast queries

The Traveller API is now fully functional and ready for production use with complete CRUD operations, soft deletion, and multi-tenant architecture.
