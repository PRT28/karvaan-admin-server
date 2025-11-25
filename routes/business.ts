import express from 'express';
import {
  registerBusiness,
  getBusinessDetails,
  updateBusiness,
  getAllBusinesses,
  toggleBusinessStatus,
} from '../controllers/business';
import { verifyJWT, requireSuperAdmin, requireSameBusiness } from '../utils/middleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Business:
 *       type: object
 *       required:
 *         - businessName
 *         - businessType
 *         - email
 *         - phone
 *         - address
 *       properties:
 *         _id:
 *           type: string
 *           description: Business ID
 *         businessName:
 *           type: string
 *           description: Name of the business
 *         businessType:
 *           type: string
 *           enum: [travel_agency, tour_operator, hotel, restaurant, transport, event_management, consulting, other]
 *           description: Type of business
 *         email:
 *           type: string
 *           format: email
 *           description: Business email address
 *         phone:
 *           type: string
 *           description: Business phone number
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             zipCode:
 *               type: string
 *         website:
 *           type: string
 *           description: Business website URL
 *         description:
 *           type: string
 *           description: Business description
 *         logo:
 *           type: string
 *           description: URL to business logo
 *         gstin:
 *           type: string
 *           description: GST identification number
 *         panNumber:
 *           type: string
 *           description: PAN number
 *         registrationNumber:
 *           type: string
 *           description: Business registration number
 *         isActive:
 *           type: boolean
 *           description: Whether the business is active
 *         subscriptionPlan:
 *           type: string
 *           enum: [basic, premium, enterprise]
 *           description: Subscription plan
 *         subscriptionExpiry:
 *           type: string
 *           format: date
 *           description: Subscription expiry date
 *         adminUserId:
 *           type: string
 *           description: ID of the admin user
 *         settings:
 *           type: object
 *           properties:
 *             allowUserRegistration:
 *               type: boolean
 *             maxUsers:
 *               type: number
 *             features:
 *               type: array
 *               items:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     BusinessRegistration:
 *       type: object
 *       required:
 *         - businessName
 *         - businessType
 *         - businessEmail
 *         - businessPhone
 *         - address
 *         - adminName
 *         - adminEmail
 *         - adminMobile
 *         - adminPhoneCode
 *         - adminPassword
 *       properties:
 *         businessName:
 *           type: string
 *           description: Name of the business
 *         businessType:
 *           type: string
 *           enum: [travel_agency, tour_operator, hotel, restaurant, transport, event_management, consulting, other]
 *         businessEmail:
 *           type: string
 *           format: email
 *         businessPhone:
 *           type: string
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             zipCode:
 *               type: string
 *         website:
 *           type: string
 *         description:
 *           type: string
 *         gstin:
 *           type: string
 *         panNumber:
 *           type: string
 *         registrationNumber:
 *           type: string
 *         adminName:
 *           type: string
 *           description: Name of the admin user
 *         adminEmail:
 *           type: string
 *           format: email
 *         adminMobile:
 *           type: string
 *         adminPhoneCode:
 *           type: number
 *         adminPassword:
 *           type: string
 *           format: password
 */

/**
 * @swagger
 * /business/register:
 *   post:
 *     summary: Register a new business with admin user
 *     tags: [Business]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusinessRegistration'
 *     responses:
 *       201:
 *         description: Business and admin user registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     business:
 *                       type: object
 *                     adminUser:
 *                       type: object
 *       400:
 *         description: Validation error or business/user already exists
 *       500:
 *         description: Server error
 */
router.post('/register', registerBusiness);

/**
 * @swagger
 * /business/{businessId}:
 *   get:
 *     summary: Get business details by ID
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
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
 *                 business:
 *                   $ref: '#/components/schemas/Business'
 *       400:
 *         description: Invalid business ID
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get('/:businessId', verifyJWT, requireSameBusiness, getBusinessDetails);

/**
 * @swagger
 * /business/{businessId}:
 *   put:
 *     summary: Update business details
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *               businessType:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               website:
 *                 type: string
 *               description:
 *                 type: string
 *               gstin:
 *                 type: string
 *               panNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Business updated successfully
 *       400:
 *         description: Invalid business ID
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.put('/:businessId', verifyJWT, requireSameBusiness, updateBusiness);

/**
 * @swagger
 * /business:
 *   get:
 *     summary: Get all businesses (Super Admin only)
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of businesses per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by business name or email
 *       - in: query
 *         name: businessType
 *         schema:
 *           type: string
 *         description: Filter by business type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Businesses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 businesses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Business'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/', verifyJWT, requireSuperAdmin, getAllBusinesses);

/**
 * @swagger
 * /business/{businessId}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate a business
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: New active status
 *     responses:
 *       200:
 *         description: Business status updated successfully
 *       400:
 *         description: Invalid business ID
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.patch('/:businessId/toggle-status', verifyJWT, requireSuperAdmin, toggleBusinessStatus);

export default router;
