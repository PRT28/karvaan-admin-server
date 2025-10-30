import {
    getAllQuotations,
    getQuotationsByParty,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotationById
} from '../controllers/quotation';

import express from 'express';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Quotations
 *   description: Quotation management endpoints
 */

/**
 * @swagger
 * /quotation/get-all-quotations:
 *   get:
 *     summary: Get all quotations
 *     description: Retrieve all quotations
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     responses:
 *       200:
 *         description: Quotations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 quotations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quotation'
 *       500:
 *         description: Failed to fetch quotations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-all-quotations', getAllQuotations);

/**
 * @swagger
 * /quotation/get-quotation/{id}:
 *   get:
 *     summary: Get quotation by ID
 *     description: Retrieve a specific quotation by ID
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID
 *     responses:
 *       200:
 *         description: Quotation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 quotation:
 *                   $ref: '#/components/schemas/Quotation'
 *       404:
 *         description: Quotation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch quotation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-quotation/:id', getQuotationById);

/**
 * @swagger
 * /quotation/get-quotations-by-party/{id}:
 *   get:
 *     summary: Get quotations by party ID
 *     description: Retrieve all quotations for a specific party (customer or vendor)
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID (Customer or Vendor ID)
 *     responses:
 *       200:
 *         description: Quotations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 quotations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quotation'
 *       500:
 *         description: Failed to fetch quotations by party
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-quotations-by-party/:id', getQuotationsByParty);

/**
 * @swagger
 * /quotation/create-quotation:
 *   post:
 *     summary: Create a new quotation
 *     description: Create a new quotation record
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quotationType, channel, partyId, formFields, totalAmount]
 *             properties:
 *               quotationType:
 *                 type: string
 *                 enum: [flight, train, hotel, activity]
 *                 example: "flight"
 *               channel:
 *                 type: string
 *                 enum: [B2B, B2C]
 *                 example: "B2C"
 *               partyId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439013"
 *               formFields:
 *                 type: object
 *                 additionalProperties: true
 *                 example:
 *                   departure: "New York"
 *                   destination: "London"
 *                   date: "2024-12-25"
 *                   passengers: 2
 *               totalAmount:
 *                 type: number
 *                 example: 1500.00
 *               status:
 *                 type: string
 *                 enum: [draft, confirmed, cancelled]
 *                 default: "draft"
 *     responses:
 *       201:
 *         description: Quotation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 quotation:
 *                   $ref: '#/components/schemas/Quotation'
 *       500:
 *         description: Failed to create quotation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// TODO: Fix TypeScript issue with createQuotation function
// router.post('/create-quotation', createQuotation);

/**
 * @swagger
 * /quotation/update-quotation/{id}:
 *   put:
 *     summary: Update a quotation
 *     description: Update an existing quotation by ID
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quotationType:
 *                 type: string
 *                 enum: [flight, train, hotel, activity]
 *               channel:
 *                 type: string
 *                 enum: [B2B, B2C]
 *               partyId:
 *                 type: string
 *               formFields:
 *                 type: object
 *                 additionalProperties: true
 *               totalAmount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [draft, confirmed, cancelled]
 *     responses:
 *       200:
 *         description: Quotation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 quotation:
 *                   $ref: '#/components/schemas/Quotation'
 *       404:
 *         description: Quotation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to update quotation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/update-quotation/:id', updateQuotation);

/**
 * @swagger
 * /quotation/delete-quotation/{id}:
 *   delete:
 *     summary: Delete a quotation
 *     description: Delete a quotation by ID
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID to delete
 *     responses:
 *       200:
 *         description: Quotation deleted successfully
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
 *                   example: "Quotation deleted successfully"
 *       404:
 *         description: Quotation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to delete quotation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/delete-quotation/:id', deleteQuotation);

export default router;
