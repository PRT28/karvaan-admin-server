import express from 'express';
import {
  createBank,
  getBanks,
  getBankById,
  updateBank,
  deleteBank,
} from '../controllers/bank';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Banks
 *   description: Bank management endpoints
 */

/**
 * @swagger
 * /bank/get-all-banks:
 *   get:
 *     summary: Get all banks
 *     description: Retrieve all banks for the business (super admin sees all).
 *     tags: [Banks]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter by deletion status (true to include deleted banks)
 *     responses:
 *       200:
 *         description: Banks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bank'
 *       500:
 *         description: Failed to fetch banks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-all-banks', getBanks);

/**
 * @swagger
 * /bank/get-bank/{id}:
 *   get:
 *     summary: Get bank by ID
 *     description: Retrieve a specific bank by ID
 *     tags: [Banks]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank ID
 *     responses:
 *       200:
 *         description: Bank retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bank:
 *                   $ref: '#/components/schemas/Bank'
 *       404:
 *         description: Bank not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch bank by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-bank/:id', getBankById);

/**
 * @swagger
 * /bank/create-bank:
 *   post:
 *     summary: Create a new bank
 *     description: Create a new bank account for a business
 *     tags: [Banks]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, accountNumber, ifscCode, accountType]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "HDFC Bank"
 *               accountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               ifscCode:
 *                 type: string
 *                 example: "HDFC0000123"
 *               accountType:
 *                 type: string
 *                 enum: [savings, current]
 *                 example: "current"
 *     responses:
 *       201:
 *         description: Bank created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bank:
 *                   $ref: '#/components/schemas/Bank'
 *       500:
 *         description: Failed to create bank
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-bank', createBank);

/**
 * @swagger
 * /bank/update-bank/{id}:
 *   put:
 *     summary: Update a bank
 *     description: Update an existing bank by ID
 *     tags: [Banks]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               ifscCode:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [savings, current]
 *     responses:
 *       200:
 *         description: Bank updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bank:
 *                   $ref: '#/components/schemas/Bank'
 *       404:
 *         description: Bank not found
 *       500:
 *         description: Failed to update bank
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/update-bank/:id', updateBank);

/**
 * @swagger
 * /bank/delete-bank/{id}:
 *   delete:
 *     summary: Delete a bank
 *     description: Soft delete a bank by ID
 *     tags: [Banks]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank ID to delete
 *     responses:
 *       200:
 *         description: Bank deleted successfully
 *       404:
 *         description: Bank not found
 *       500:
 *         description: Failed to delete bank
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/delete-bank/:id', deleteBank);

export default router;
