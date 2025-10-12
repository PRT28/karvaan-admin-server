# New Authentication System Test Guide

## Overview
The authentication system has been updated to use username/password login with 2FA via email instead of OTP-based login.

## Setup Required

1. **Install dependencies** (if not already installed):
   ```bash
   npm install nodemailer @types/nodemailer
   ```

2. **Configure email settings** in `.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
   
   **Note**: For Gmail, you need to:
   - Enable 2-factor authentication on your Google account
   - Generate an "App Password" for this application
   - Use the app password instead of your regular password

## API Endpoints

### 1. Create User with Password
**POST** `/auth/insert`

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "mobile": "+1234567890",
  "agentId": "AGENT001",
  "phoneCode": 1,
  "roleId": "role_object_id_here",
  "superAdmin": false,
  "password": "securePassword123"
}
```

### 2. Login with Username/Password
**POST** `/auth/login`

```json
{
  "email": "test@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "2FA code sent to your email",
  "success": true,
  "email": "test@example.com"
}
```

### 3. Verify 2FA Code
**POST** `/auth/verify-2fa`

```json
{
  "email": "test@example.com",
  "twoFACode": "123456"
}
```

**Response:**
```json
{
  "message": "2FA verified successfully. Login successful.",
  "success": true,
  "user": { /* user object */ },
  "token": "jwt_token_here"
}
```

## Authentication Flow

1. **User enters email and password** → System validates credentials
2. **If valid** → System sends 6-digit 2FA code to user's email
3. **User enters 2FA code** → System verifies code
4. **If code is valid** → System creates JWT session token

## Security Features

- ✅ Passwords are encrypted using bcryptjs with salt rounds
- ✅ 2FA codes expire after 5 minutes
- ✅ 2FA codes are sent via email using nodemailer
- ✅ JWT tokens are created only after successful 2FA verification
- ✅ Passwords are never returned in API responses

## Removed Features

The following legacy OTP-based endpoints have been completely removed:
- ❌ `/auth/send-otp/agent` (removed)
- ❌ `/auth/send-otp/super-admin` (removed)
- ❌ `/auth/verify-otp` (removed)
- ❌ Twilio SMS functionality (removed)
- ❌ Phone-based OTP authentication (removed)

## Testing Steps

1. Start the server: `npm run dev`
2. Create a test user with the `/auth/insert` endpoint
3. Try logging in with `/auth/login`
4. Check your email for the 2FA code
5. Verify the 2FA code with `/auth/verify-2fa`
6. Use the returned JWT token for authenticated requests
