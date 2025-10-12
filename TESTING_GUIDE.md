# Testing Guide - Authentication & API

## Quick Setup

### 1. Create Dummy Data
Run this command to create test users with properly hashed passwords:

```bash
npm run create-dummy-data
```

This will create:
- 4 different roles (Super Admin, Admin, Manager, Sales Agent)
- 5 test users with different permission levels
- All passwords are properly hashed using bcrypt

### 2. Test Credentials

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `superadmin@cooncierge.com` | `SuperAdmin123!` | Super Admin | Full access to everything |
| `admin@cooncierge.com` | `Admin123!` | Admin | Most permissions, limited delete access |
| `manager@cooncierge.com` | `Manager123!` | Manager | Sales + limited operations access |
| `sales@cooncierge.com` | `Sales123!` | Sales Agent | Sales operations only |
| `test@example.com` | `Test123!` | Sales Agent | Sales operations only |

## Authentication Flow Testing

### Step 1: Login with Email/Password
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@cooncierge.com",
    "password": "SuperAdmin123!"
  }'
```

**Expected Response:**
```json
{
  "message": "2FA code sent to your email",
  "success": true,
  "email": "superadmin@cooncierge.com"
}
```

### Step 2: Check Email for 2FA Code
- Check the email inbox for `superadmin@cooncierge.com`
- Look for a 6-digit code (e.g., `123456`)

### Step 3: Verify 2FA Code
```bash
curl -X POST http://localhost:8080/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@cooncierge.com",
    "twoFACode": "123456"
  }'
```

**Expected Response:**
```json
{
  "message": "2FA verified successfully. Login successful.",
  "success": true,
  "user": {
    "_id": "...",
    "name": "Super Admin User",
    "email": "superadmin@cooncierge.com",
    "roleId": "...",
    "superAdmin": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 4: Use JWT Token for Protected Routes
Copy the `token` from Step 3 and use it in the Authorization header:

```bash
curl -X GET http://localhost:8080/customer/get-all-customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "x-access-token: YOUR_KARVAAN_TOKEN"
```

## Testing with Swagger UI

### 1. Access Swagger Documentation
Open your browser and go to: http://localhost:8080/api-docs

### 2. Authenticate in Swagger
1. Click the **"Authorize"** button at the top
2. For **bearerAuth**: Enter `Bearer YOUR_JWT_TOKEN`
3. For **karvaanToken**: Enter your Karvaan token in `x-access-token`
4. Click **"Authorize"**

### 3. Test Endpoints
- All endpoints are now documented and testable
- Try the authentication flow first
- Then test protected endpoints like customers, vendors, etc.

## Manual Password Hashing (Alternative Method)

If you want to manually create users or hash passwords:

### Using the insertTest Endpoint
```bash
curl -X POST http://localhost:8080/auth/insert \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual User",
    "email": "manual@example.com",
    "mobile": "+1234567895",
    "phoneCode": 1,
    "roleId": "ROLE_ID_HERE",
    "password": "MyPassword123!",
    "superAdmin": false
  }'
```

### Using Node.js Console
```javascript
const bcrypt = require('bcryptjs');

// Hash a password
const hashPassword = async (password) => {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(password, saltRounds);
  console.log('Hashed password:', hashed);
  return hashed;
};

// Test password comparison
const testPassword = async (password, hash) => {
  const isValid = await bcrypt.compare(password, hash);
  console.log('Password valid:', isValid);
  return isValid;
};

// Usage
hashPassword('MyPassword123!');
```

## Common Issues & Solutions

### Issue: "User not found"
- **Solution**: Make sure you ran `npm run create-dummy-data` successfully
- Check MongoDB connection and that users were created

### Issue: "Invalid email or password"
- **Solution**: Double-check the email and password from the credentials table
- Passwords are case-sensitive

### Issue: "Invalid 2FA code"
- **Solution**: Check your email for the latest 2FA code
- Codes expire after 5 minutes
- Make sure you're using the correct email address

### Issue: "Email not configured"
- **Solution**: Make sure your `.env` file has:
  ```
  EMAIL_USER=mfa@cooncierge.com
  EMAIL_PASSWORD=dkphdzwqglfbvvtl
  ```

### Issue: "Unauthorized" on protected routes
- **Solution**: Make sure you're including the JWT token in the Authorization header
- Format: `Authorization: Bearer YOUR_JWT_TOKEN`
- Also include `x-access-token` header for Karvaan token

## Role-Based Testing

Test different permission levels:

1. **Super Admin** (`superadmin@cooncierge.com`): Can access all endpoints
2. **Admin** (`admin@cooncierge.com`): Most access, limited delete permissions
3. **Manager** (`manager@cooncierge.com`): Sales + limited operations
4. **Sales Agent** (`sales@cooncierge.com`): Sales operations only

Try accessing different endpoints with different user roles to test the permission system.

## Database Verification

To verify users were created correctly:

```javascript
// In MongoDB shell or Compass
db.users.find({}, { name: 1, email: 1, password: 1 }).pretty()
db.roles.find({}, { roleName: 1, permission: 1 }).pretty()
```

The passwords should be hashed strings starting with `$2b$10$...`

## Next Steps

1. Run `npm run create-dummy-data`
2. Start the server with `npm run dev`
3. Test authentication flow with any of the provided credentials
4. Use Swagger UI at http://localhost:8080/api-docs for interactive testing
5. Create your own users and test the full application flow
