import {
    createNewRole,
    createOrUpdateUser,
    deleteUser,
    forgotPassword,
    getAllUsers,
    getUserById,
    insertTest,
    loginWithPassword,
    registerBusinessUser,
    verify2FA,
    uploadProfileImage,
    deleteProfileImage,
    uploadCompanyLogo,
    deleteCompanyLogo,
    getCompanyDetails,
    updateCompanyDetails,
    getCurrentUser,
    resetPassword,
    resetPasswordRequest,
    getBusinessRoles,
    activateBusinessUser,
    deactivateBusinessUser
} from "../controllers/auth";
import express from "express";

import { checkKarvaanToken } from "../utils/middleware";
import { handleProfileImageUploadError } from "../middleware/documentUpload";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Authenticate user with email/password and send 2FA code to email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 2FA code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Email and password are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", loginWithPassword);

/**
 * @swagger
 * /auth/verify-2fa:
 *   post:
 *     summary: Verify 2FA code and complete login
 *     description: Verify the 2FA code sent to email and receive JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Verify2FARequest'
 *     responses:
 *       200:
 *         description: 2FA verified successfully, login complete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Email and 2FA code are required or invalid 2FA code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/verify-2fa", verify2FA);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset notification to business administrator for the user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user requesting password reset
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset notification has been sent to your business administrator. They will contact you shortly to assist with password recovery."
 *                 adminNotified:
 *                   type: object
 *                   properties:
 *                     adminName:
 *                       type: string
 *                       example: "John Admin"
 *                     businessName:
 *                       type: string
 *                       example: "Test Travel Agency"
 *       400:
 *         description: Email is required or user/business validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email is required"
 *       500:
 *         description: Internal server error or email sending failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to send password reset notification. Please try again later."
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/insert:
 *   post:
 *     summary: Create a new user (Test endpoint)
 *     description: Create a new user with encrypted password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, mobile, phoneCode, roleId, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *               agentId:
 *                 type: string
 *                 example: "AGENT001"
 *               phoneCode:
 *                 type: number
 *                 example: 1
 *               roleId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               superAdmin:
 *                 type: boolean
 *                 default: false
 *               password:
 *                 type: string
 *                 example: "securePassword123"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Password is required
 *       500:
 *         description: Internal server error
 */
router.post("/insert", insertTest);

/**
 * @swagger
 * /auth/create-or-update-user:
 *   post:
 *     summary: Create or update user
 *     description: Create a new user or update existing user (requires authentication)
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile, email, roleId, gender, phoneCode]
 *             properties:
 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               roleId:
 *                 type: string
 *               gender:
 *                 type: string
 *               phoneCode:
 *                 type: number
 *               userId:
 *                 type: string
 *                 description: "Required for update, omit for create"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing required fields or user not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/create-or-update-user", checkKarvaanToken, createOrUpdateUser);

/**
 * @swagger
 * /auth/create-new-role:
 *   post:
 *     summary: Create a new role
 *     description: Create a new role with permissions
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleName, permission]
 *             properties:
 *               roleName:
 *                 type: string
 *                 example: "Manager"
 *               permission:
 *                 $ref: '#/components/schemas/Permissions'
 *     responses:
 *       201:
 *         description: Role created successfully
 *       500:
 *         description: Internal server error
 */
router.post("/create-new-role", checkKarvaanToken, createNewRole);

/**
 * @swagger
 * /auth/delete-user/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user by ID (requires authentication)
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: User ID is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete("/delete-user/:id", checkKarvaanToken, deleteUser);

/**
 * @swagger
 * /auth/get-all-users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users with populated role information (requires authentication)
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Users retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/get-all-users", checkKarvaanToken, getAllUsers);

/**
 * @swagger
 * /auth/get-user/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by ID with populated role information (requires authentication)
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to retrieve
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: User ID is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/get-user/:id", checkKarvaanToken, getUserById);

/**
 * @swagger
 * /auth/register-business-user:
 *   post:
 *     summary: Register a new user under a business
 *     description: Register a new user under an existing business (Business Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - mobile
 *               - phoneCode
 *               - roleId
 *               - password
 *               - businessId
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               mobile:
 *                 type: string
 *                 description: User's mobile number
 *                 example: "9876543210"
 *               phoneCode:
 *                 type: number
 *                 description: Country phone code
 *                 example: 91
 *               roleId:
 *                 type: string
 *                 description: Role ID for the user
 *                 example: "60d5ecb74b24a1234567890a"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: "SecurePassword123!"
 *               businessId:
 *                 type: string
 *                 description: Business ID the user belongs to
 *                 example: "60d5ecb74b24a1234567890b"
 *     responses:
 *       201:
 *         description: Business user registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Business user registered successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or business limit reached
 *       404:
 *         description: Business not found
 *       500:
 *         description: Internal server error
 */
router.post("/register-business-user", registerBusinessUser);

/**
 * @swagger
 * /auth/upload-profile-image/{userId}:
 *   post:
 *     summary: Upload profile image for a user
 *     description: Upload a profile image for a specific user. Replaces existing image if present.
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to upload profile image for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [profileImage]
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG, PNG, GIF, WEBP). Max 2MB.
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile image uploaded successfully"
 *                 profileImage:
 *                   type: object
 *                   properties:
 *                     originalName:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     url:
 *                       type: string
 *                     key:
 *                       type: string
 *                     size:
 *                       type: number
 *                     mimeType:
 *                       type: string
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error (no file, invalid type, file too large)
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to upload profile image
 */
router.post("/upload-profile-image/:userId", checkKarvaanToken, handleProfileImageUploadError, uploadProfileImage);

/**
 * @swagger
 * /auth/delete-profile-image/{userId}:
 *   delete:
 *     summary: Delete profile image for a user
 *     description: Delete the profile image for a specific user
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete profile image for
 *     responses:
 *       200:
 *         description: Profile image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile image deleted successfully"
 *       400:
 *         description: User does not have a profile image
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete profile image
 */
router.delete("/delete-profile-image/:userId", checkKarvaanToken, deleteProfileImage);

/**
 * @swagger
 * /auth/upload-company-logo:
 *   post:
 *     summary: Upload company logo
 *     description: Upload a company logo for the authenticated user's business (stored as business profile image).
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [profileImage]
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file (JPEG, PNG, GIF, WEBP). Max 2MB.
 *     responses:
 *       200:
 *         description: Company logo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile image uploaded successfully"
 *                 profileImage:
 *                   $ref: '#/components/schemas/UploadedDocument'
 *       400:
 *         description: Validation error (no file, invalid type, file too large)
 *       404:
 *         description: Business not found
 *       500:
 *         description: Failed to upload company logo
 */
router.post("/upload-company-logo", checkKarvaanToken, handleProfileImageUploadError, uploadCompanyLogo);

/**
 * @swagger
 * /auth/delete-company-logo:
 *   delete:
 *     summary: Delete company logo
 *     description: Delete the company logo for the authenticated user's business.
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     responses:
 *       200:
 *         description: Company logo deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile image deleted successfully"
 *       400:
 *         description: Business does not have a logo
 *       404:
 *         description: Business not found
 *       500:
 *         description: Failed to delete company logo
 */
router.delete("/delete-company-logo", checkKarvaanToken, deleteCompanyLogo);

/**
 * @swagger
 * /auth/get-company-details:
 *   get:
 *     summary: Get company details
 *     description: Retrieve the authenticated user's business details.
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     responses:
 *       200:
 *         description: Business details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 business:
 *                   $ref: '#/components/schemas/Business'
 *       404:
 *         description: Business not found
 *       500:
 *         description: Failed to fetch business details
 */
router.get("/get-company-details", checkKarvaanToken, getCompanyDetails);

/**
 * @swagger
 * /auth/update-company-details:
 *   patch:
 *     summary: Update company details
 *     description: Update the authenticated user's business details.
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update on the business record.
 *             properties:
 *               businessName:
 *                 type: string
 *               businessType:
 *                 type: string
 *                 enum: [travel_agency, tour_operator, hotel, restaurant, transport, event_management, consulting, other]
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               website:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *               gstin:
 *                 type: string
 *               panNumber:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   allowUserRegistration:
 *                     type: boolean
 *                   maxUsers:
 *                     type: integer
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Business details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 business:
 *                   $ref: '#/components/schemas/Business'
 *       404:
 *         description: Business not found
 *       500:
 *         description: Failed to update business details
 */
router.patch("/update-company-details", checkKarvaanToken, updateCompanyDetails);

/**
 * @swagger
 * /auth/get-current-user:
 *   get:
 *     summary: Get current user
 *     description: Retrieve the authenticated user's details from the token context.
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       500:
 *         description: Failed to fetch current user
 */
router.get("/get-current-user", checkKarvaanToken, getCurrentUser);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset the password for the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: New password for the user
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *       400:
 *         description: New password is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to reset password
 */
router.post("/reset-password", checkKarvaanToken, resetPassword);

/**
 * @swagger
 * /auth/reset-password-request:
 *   post:
 *     summary: Reset password request
 *     description: Reset the password for a user (business admin only)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, password]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to reset password for
 *               password:
 *                 type: string
 *                 description: New password for the user
 *               autoGeneratePassword:
 *                 type: boolean
 *                 description: Whether to auto-generate a password
 *               requireReset:
 *                 type: boolean
 *                 description: Whether to require the user to reset password on next login
 *     responses:
 *       200:
 *         description: Password reset request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *       400:
 *         description: User ID and password are required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to process password reset request
 */
router.post("/reset-password-request", resetPasswordRequest);

/**
 * @swagger
 * /auth/business/roles:
 *   get:
 *     summary: Get business roles with users
 *     description: Retrieve all roles for the authenticated user's business along with assigned users.
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 output:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Role ID
 *                       name:
 *                         type: string
 *                         description: Role name
 *                       permissions:
 *                         $ref: '#/components/schemas/Permissions'
 *                       users:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/User'
 *       404:
 *         description: Roles not found
 *       500:
 *         description: Failed to fetch roles
 */
router.get("/business/roles", checkKarvaanToken, getBusinessRoles);

/**
 * @swagger
 * /auth/business/users/activate:
 *   patch:
 *     summary: Activate business users
 *     description: Activate multiple users by ID for the authenticated user's business.
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user IDs to activate
 *     responses:
 *       200:
 *         description: Users activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Users activated successfully"
 *       500:
 *         description: Failed to activate users
 */
router.patch("/business/users/activate", checkKarvaanToken, activateBusinessUser);

/**
 * @swagger
 * /auth/business/users/deactivate:
 *   patch:
 *     summary: Deactivate business users
 *     description: Deactivate multiple users by ID for the authenticated user's business.
 *     tags: [Authentication]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user IDs to deactivate
 *     responses:
 *       200:
 *         description: Users deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Users deactivated successfully"
 *       500:
 *         description: Failed to deactivate users
 */
router.patch("/business/users/deactivate", checkKarvaanToken, deactivateBusinessUser);

export default router;
