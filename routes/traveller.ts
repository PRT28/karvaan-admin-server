import express from "express";
import { 
    getTravellers, 
    getTravellerById, 
    createTraveller,
    updateTraveller, 
    deleteTraveller,
    restoreTraveller
} from "../controllers/traveller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Travellers
 *   description: Traveller management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Traveller:
 *       type: object
 *       required:
 *         - name
 *         - businessId
 *       properties:
 *         _id:
 *           type: string
 *           description: Traveller ID
 *         name:
 *           type: string
 *           description: Full name of the traveller
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         phone:
 *           type: string
 *           description: Phone number
 *         passportNumber:
 *           type: string
 *           description: Passport number
 *         passportExpiry:
 *           type: string
 *           format: date
 *           description: Passport expiry date
 *         nationality:
 *           type: string
 *           description: Nationality
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: Gender
 *         address:
 *           type: string
 *           description: Address
 *         emergencyContact:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: Emergency contact name
 *             phone:
 *               type: string
 *               description: Emergency contact phone
 *             relationship:
 *               type: string
 *               description: Relationship to traveller
 *         businessId:
 *           type: string
 *           description: Business ID
 *         customerId:
 *           type: string
 *           description: Associated customer ID
 *         isDeleted:
 *           type: boolean
 *           description: Soft delete flag
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     TravellerResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         traveller:
 *           $ref: '#/components/schemas/Traveller'
 *     TravellersResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         count:
 *           type: number
 *         travellers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Traveller'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /traveller/get-all-travellers:
 *   get:
 *     summary: Get all travellers
 *     description: Retrieve all travellers with optional filters
 *     tags: [Travellers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by deleted status (default: false)
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: Travellers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravellersResponse'
 *       500:
 *         description: Failed to fetch travellers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-all-travellers', getTravellers);

/**
 * @swagger
 * /traveller/get-traveller/{id}:
 *   get:
 *     summary: Get traveller by ID
 *     description: Retrieve a specific traveller by their ID
 *     tags: [Travellers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Traveller ID
 *     responses:
 *       200:
 *         description: Traveller retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravellerResponse'
 *       404:
 *         description: Traveller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch traveller
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-traveller/:id', getTravellerById);

/**
 * @swagger
 * /traveller/create-traveller:
 *   post:
 *     summary: Create a new traveller
 *     description: Create a new traveller record
 *     tags: [Travellers]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the traveller
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               phone:
 *                 type: string
 *                 description: Phone number
 *               passportNumber:
 *                 type: string
 *                 description: Passport number
 *               passportExpiry:
 *                 type: string
 *                 format: date
 *                 description: Passport expiry date
 *               nationality:
 *                 type: string
 *                 description: Nationality
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: Gender
 *               address:
 *                 type: string
 *                 description: Address
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Emergency contact name
 *                   phone:
 *                     type: string
 *                     description: Emergency contact phone
 *                   relationship:
 *                     type: string
 *                     description: Relationship to traveller
 *               customerId:
 *                 type: string
 *                 description: Associated customer ID
 *     responses:
 *       201:
 *         description: Traveller created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravellerResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to create traveller
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-traveller', createTraveller);

/**
 * @swagger
 * /traveller/update-traveller/{id}:
 *   put:
 *     summary: Update traveller
 *     description: Update an existing traveller record
 *     tags: [Travellers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Traveller ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the traveller
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               phone:
 *                 type: string
 *                 description: Phone number
 *               passportNumber:
 *                 type: string
 *                 description: Passport number
 *               passportExpiry:
 *                 type: string
 *                 format: date
 *                 description: Passport expiry date
 *               nationality:
 *                 type: string
 *                 description: Nationality
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: Gender
 *               address:
 *                 type: string
 *                 description: Address
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Emergency contact name
 *                   phone:
 *                     type: string
 *                     description: Emergency contact phone
 *                   relationship:
 *                     type: string
 *                     description: Relationship to traveller
 *               customerId:
 *                 type: string
 *                 description: Associated customer ID
 *     responses:
 *       200:
 *         description: Traveller updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravellerResponse'
 *       404:
 *         description: Traveller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to update traveller
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/update-traveller/:id', updateTraveller);

/**
 * @swagger
 * /traveller/delete-traveller/{id}:
 *   delete:
 *     summary: Delete traveller (soft delete)
 *     description: Soft delete a traveller by setting isDeleted to true
 *     tags: [Travellers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Traveller ID
 *     responses:
 *       200:
 *         description: Traveller deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 traveller:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     isDeleted:
 *                       type: boolean
 *       404:
 *         description: Traveller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to delete traveller
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/delete-traveller/:id', deleteTraveller);

/**
 * @swagger
 * /traveller/restore-traveller/{id}:
 *   patch:
 *     summary: Restore traveller
 *     description: Restore a soft-deleted traveller by setting isDeleted to false
 *     tags: [Travellers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Traveller ID
 *     responses:
 *       200:
 *         description: Traveller restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravellerResponse'
 *       404:
 *         description: Traveller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to restore traveller
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/restore-traveller/:id', restoreTraveller);

export default router;
