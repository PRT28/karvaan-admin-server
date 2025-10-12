import {
    createNewRole,
    createOrUpdateUser,
    deleteUser,
    getAllUsers,
    getUserById,
    insertTest,
    loginWithPassword,
    verify2FA
} from "../controllers/auth";
import express from "express";

import { checkKarvaanToken } from "../utils/middleware";

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
router.post("/create-new-role", createNewRole);

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

export default router;
