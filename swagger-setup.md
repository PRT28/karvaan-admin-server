# Swagger API Documentation Setup

## Overview
Comprehensive Swagger/OpenAPI 3.0 documentation has been implemented for the entire Cooncierge Admin API. The documentation includes all endpoints, request/response schemas, authentication methods, and interactive testing capabilities.

## Access the Documentation

Once the server is running, you can access the Swagger UI at:
- **Local Development**: http://localhost:8080/api-docs
- **Production**: https://api.karvaann.com/api-docs

## Features

### 🔧 **Complete API Coverage**
- ✅ **Authentication** - Login, 2FA, user management
- ✅ **Customers** - Full CRUD operations
- ✅ **Vendors** - Full CRUD operations  
- ✅ **Teams** - Full CRUD operations
- ✅ **Quotations** - Full CRUD operations
- ✅ **Logs** - Task management and dashboard endpoints
- ✅ **Health** - Server status endpoints

### 🔐 **Security Documentation**
- **Bearer Authentication** - JWT tokens from login/2FA
- **Karvaan Token** - API key authentication for protected routes
- Clear indication of which endpoints require authentication

### 📋 **Comprehensive Schemas**
- **User** - Complete user model with roles and permissions
- **Customer** - Customer management with tier system
- **Vendor** - Vendor information with GSTIN support
- **Team** - Team member management with roles
- **Quotation** - Dynamic quotation system with form fields
- **Logs** - Task logging with status tracking
- **Roles & Permissions** - CRUD-based permission system

### 🎯 **Interactive Testing**
- Test all endpoints directly from the documentation
- Authentication token management
- Request/response examples
- Parameter validation
- Error response documentation

## API Endpoints Summary

### Authentication (`/auth`)
- `POST /auth/login` - Email/password login with 2FA
- `POST /auth/verify-2fa` - Verify 2FA code and get JWT token
- `POST /auth/insert` - Create new user (test endpoint)
- `POST /auth/create-or-update-user` - User management (protected)
- `POST /auth/create-new-role` - Role creation
- `GET /auth/get-all-users` - List all users (protected)
- `GET /auth/get-user/{id}` - Get user by ID (protected)
- `DELETE /auth/delete-user/{id}` - Delete user (protected)

### Customers (`/customer`) - All Protected
- `GET /customer/get-all-customers` - List all customers
- `GET /customer/get-customer/{id}` - Get customer by ID
- `POST /customer/create-customer` - Create new customer
- `PUT /customer/update-customer/{id}` - Update customer
- `DELETE /customer/delete-customer/{id}` - Delete customer

### Vendors (`/vendor`) - All Protected
- `GET /vendor/get-all-vendors` - List all vendors
- `GET /vendor/get-vendor/{id}` - Get vendor by ID
- `POST /vendor/create-vendor` - Create new vendor
- `PUT /vendor/update-vendor/{id}` - Update vendor
- `DELETE /vendor/delete-vendor/{id}` - Delete vendor

### Teams (`/team`) - All Protected
- `GET /team/get-all-teams` - List all team members
- `GET /team/get-team/{id}` - Get team member by ID
- `POST /team/create-team` - Create new team member
- `PUT /team/update-team/{id}` - Update team member
- `DELETE /team/delete-team/{id}` - Delete team member

### Quotations (`/quotation`) - All Protected
- `GET /quotation/get-all-quotations` - List all quotations
- `GET /quotation/get-quotation/{id}` - Get quotation by ID
- `GET /quotation/get-quotations-by-party/{id}` - Get quotations by party
- `POST /quotation/create-quotation` - Create new quotation
- `PUT /quotation/update-quotation/{id}` - Update quotation
- `DELETE /quotation/delete-quotation/{id}` - Delete quotation

### Logs (`/logs`) - All Protected
- `GET /logs/get-all-logs` - List all logs
- `GET /logs/get-user-logs/{userId}` - User dashboard data
- `GET /logs/monthly-summary/{userId}` - Monthly log summary
- `POST /logs/create-log` - Create new log entry
- `PUT /logs/update-log/{logId}` - Update log entry
- `PATCH /logs/update-log-status/{logId}` - Update log status only
- `DELETE /logs/delete-log/{logId}` - Delete log entry

### Health (`/`)
- `GET /` - Root endpoint with server status
- `GET /health` - Health check endpoint

## Authentication Flow

1. **Login**: `POST /auth/login` with email/password
2. **2FA**: `POST /auth/verify-2fa` with email/2FA code
3. **Use Token**: Include JWT token in `Authorization: Bearer <token>` header
4. **Protected Routes**: Use `x-access-token` header for Karvaan token authentication

## Schema Highlights

### Dynamic Quotation System
```json
{
  "quotationType": "flight|train|hotel|activity",
  "channel": "B2B|B2C",
  "formFields": {
    "departure": "New York",
    "destination": "London",
    "date": "2024-12-25",
    "passengers": 2
  }
}
```

### Comprehensive Permission System
```json
{
  "sales": { "create": true, "read": true, "update": true, "delete": false },
  "operateions": {
    "voucher": { "create": true, "read": true, "update": true, "delete": false },
    "content": { "create": false, "read": true, "update": false, "delete": false }
  },
  "userAccess": {
    "roles": { "create": true, "read": true, "update": true, "delete": true },
    "user": { "create": true, "read": true, "update": true, "delete": false }
  }
}
```

### Task Status Tracking
- **Pending** - Newly created tasks
- **In Progress** - Tasks being worked on
- **Completed** - Finished tasks
- **On Hold** - Temporarily paused tasks

## Dependencies Added
- `swagger-jsdoc: ^6.2.8` - Generate OpenAPI specs from JSDoc comments
- `swagger-ui-express: ^5.0.0` - Serve Swagger UI interface
- `@types/swagger-jsdoc: ^6.0.4` - TypeScript definitions
- `@types/swagger-ui-express: ^4.1.6` - TypeScript definitions

## Files Modified
- `package.json` - Added Swagger dependencies
- `swagger.ts` - Main Swagger configuration and schemas
- `index.ts` - Integrated Swagger UI setup
- `routes/*.ts` - Added comprehensive endpoint documentation
- All route files now include detailed OpenAPI annotations

## Usage Tips

1. **Testing Authentication**:
   - Use `/auth/login` to get 2FA code
   - Use `/auth/verify-2fa` to get JWT token
   - Click "Authorize" button in Swagger UI to set token

2. **Exploring Schemas**:
   - Check the "Schemas" section for detailed model definitions
   - Use example values provided in the documentation

3. **Error Handling**:
   - All endpoints document possible error responses
   - Standard error format with success/message/error fields

The Swagger documentation is now fully integrated and provides a comprehensive, interactive interface for exploring and testing the entire API.
