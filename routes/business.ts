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
 * tags:
 *   name: Business
 *   description: Business management endpoints
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
