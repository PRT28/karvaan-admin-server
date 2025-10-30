# Business Model Implementation Guide

## Overview

The Cooncierge Admin API has been enhanced with a multi-tenant business model where users belong to businesses. This enables proper data isolation and business-specific functionality.

## Architecture

### User Types

1. **Super Admin** (`super_admin`)
   - System-wide access
   - Can manage all businesses
   - Not tied to any specific business
   - Legacy `superAdmin: true` users are migrated to this type

2. **Business Admin** (`business_admin`)
   - Admin of a specific business
   - Can manage users within their business
   - Can register new users for their business
   - Full access to their business data

3. **Business User** (`business_user`)
   - Regular user within a business
   - Access limited to their business data
   - Cannot register new users

### Business Model

Each business has:
- Basic information (name, type, contact details)
- Address and legal details (GSTIN, PAN, etc.)
- Subscription plan and expiry
- Settings (max users, features, etc.)
- Admin user reference

## API Endpoints

### Business Management

#### Register New Business
```http
POST /business/register
```

**Request Body:**
```json
{
  "businessName": "Travel Agency XYZ",
  "businessType": "travel_agency",
  "businessEmail": "admin@travelxyz.com",
  "businessPhone": "9876543210",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "zipCode": "400001"
  },
  "website": "https://travelxyz.com",
  "description": "Premium travel services",
  "gstin": "27ABCDE1234F1Z5",
  "panNumber": "ABCDE1234F",
  "adminName": "John Doe",
  "adminEmail": "john@travelxyz.com",
  "adminMobile": "9876543210",
  "adminPhoneCode": 91,
  "adminPassword": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Business and admin user registered successfully",
  "data": {
    "business": {
      "id": "64f5e8b2c1234567890abcde",
      "businessName": "Travel Agency XYZ",
      "email": "admin@travelxyz.com",
      "businessType": "travel_agency"
    },
    "adminUser": {
      "id": "64f5e8b2c1234567890abcdf",
      "name": "John Doe",
      "email": "john@travelxyz.com",
      "userType": "business_admin"
    }
  }
}
```

#### Get Business Details
```http
GET /business/{businessId}
Authorization: Bearer <jwt_token>
```

#### Update Business
```http
PUT /business/{businessId}
Authorization: Bearer <jwt_token>
```

#### Get All Businesses (Super Admin Only)
```http
GET /business?page=1&limit=10&search=travel&businessType=travel_agency
Authorization: Bearer <jwt_token>
```

#### Toggle Business Status (Super Admin Only)
```http
PATCH /business/{businessId}/toggle-status
Authorization: Bearer <jwt_token>

{
  "isActive": false
}
```

### User Management

#### Register Business User (Business Admin Only)
```http
POST /auth/register-business-user
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@travelxyz.com",
  "mobile": "9876543211",
  "phoneCode": 91,
  "roleId": "64f5e8b2c1234567890abce0",
  "password": "UserPassword123!",
  "businessId": "64f5e8b2c1234567890abcde"
}
```

#### Login (Enhanced with Business Info)
```http
POST /auth/login

{
  "email": "john@travelxyz.com",
  "password": "SecurePassword123!"
}
```

**Response includes business information:**
```json
{
  "message": "2FA code sent to your email",
  "success": true,
  "user": {
    "name": "John Doe",
    "email": "john@travelxyz.com",
    "userType": "business_admin",
    "businessId": "64f5e8b2c1234567890abcde"
  }
}
```

## Authentication & Authorization

### JWT Token Structure

The JWT token now includes business information:
```json
{
  "_id": "64f5e8b2c1234567890abcdf",
  "name": "John Doe",
  "email": "john@travelxyz.com",
  "userType": "business_admin",
  "businessId": "64f5e8b2c1234567890abcde",
  "businessInfo": {
    "businessId": "64f5e8b2c1234567890abcde",
    "businessName": "Travel Agency XYZ",
    "businessType": "travel_agency"
  }
}
```

### Middleware Functions

1. **`verifyJWT`** - Verifies JWT token and fetches fresh user data
2. **`requireSuperAdmin`** - Ensures user is super admin
3. **`requireBusinessAdmin`** - Ensures user is business admin or super admin
4. **`requireSameBusiness`** - Ensures user can only access their business data

### Access Control Rules

| User Type | Can Access | Restrictions |
|-----------|------------|--------------|
| Super Admin | All businesses and data | None |
| Business Admin | Own business data only | Cannot access other businesses |
| Business User | Own business data only | Cannot register new users |

## Data Isolation

### Automatic Filtering

All data queries are automatically filtered by business:
- Customers belong to businesses
- Vendors belong to businesses  
- Quotations are linked to business parties
- Teams are business-specific
- Logs are business-specific

### Database Queries

Example of business-filtered query:
```javascript
// Before (no business filtering)
const customers = await Customer.find();

// After (business filtering)
const customers = await Customer.find({ businessId: user.businessId });
```

## Migration

### Existing Data Migration

Run the migration script to update existing data:
```bash
npm run migrate-users-to-business
```

The migration:
1. Converts `superAdmin: true` users to `super_admin` type
2. Creates a default business for existing users
3. Assigns users to the default business
4. Sets the first user as business admin

### Manual Steps After Migration

1. **Review Default Business**: Update the default business details
2. **Create Additional Businesses**: Register new businesses as needed
3. **Reassign Users**: Move users to appropriate businesses
4. **Update Roles**: Assign proper roles to users

## Business Types

Available business types:
- `travel_agency` - Travel Agency
- `tour_operator` - Tour Operator  
- `hotel` - Hotel/Accommodation
- `restaurant` - Restaurant/Food Service
- `transport` - Transportation Service
- `event_management` - Event Management
- `consulting` - Consulting Service
- `other` - Other Business Type

## Subscription Management

### Subscription Plans
- `basic` - Basic features, limited users
- `premium` - Advanced features, more users
- `enterprise` - Full features, unlimited users

### Subscription Validation

The system automatically checks:
- Business subscription expiry during login
- User limits when registering new users
- Feature access based on subscription plan

## Error Handling

### Common Error Responses

```json
// Business not found
{
  "success": false,
  "message": "Business not found"
}

// Business inactive
{
  "success": false,
  "message": "Business account is inactive"
}

// Subscription expired
{
  "success": false,
  "message": "Your business subscription has expired. Please renew to continue."
}

// User limit reached
{
  "success": false,
  "message": "Business has reached maximum user limit of 10"
}

// Access denied
{
  "success": false,
  "message": "Forbidden: Cannot access other business data"
}
```

## Best Practices

### For Frontend Applications

1. **Store Business Info**: Save business information from login response
2. **Check User Type**: Adapt UI based on user type (super_admin, business_admin, business_user)
3. **Handle Business Context**: Always include business context in API calls
4. **Subscription Awareness**: Show subscription status and limits

### For API Development

1. **Always Filter by Business**: Ensure all queries include business filtering
2. **Validate Business Access**: Use middleware to check business access
3. **Handle Subscription Limits**: Check limits before creating resources
4. **Audit Business Actions**: Log business-specific actions

## Testing

### Test Scenarios

1. **Business Registration**: Test complete business + admin registration flow
2. **User Registration**: Test business user registration with limits
3. **Data Isolation**: Verify users can only see their business data
4. **Subscription Validation**: Test expired subscription handling
5. **Access Control**: Test different user type permissions

### Test Data

Use the dummy data script to create test businesses and users:
```bash
npm run create-dummy-data
```

## Security Considerations

1. **Business Isolation**: Strict data isolation between businesses
2. **Subscription Enforcement**: Automatic subscription validation
3. **User Limits**: Enforced user limits per business
4. **Access Logging**: All business access is logged
5. **Token Validation**: Fresh user data fetched on each request

The business model provides a robust foundation for multi-tenant SaaS functionality while maintaining security and data isolation.
