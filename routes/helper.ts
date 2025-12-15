import express from 'express';
import { generateCustomId } from '../controllers/customId';

const router = express.Router();

/**
 * @swagger
 * /helper/custom-id:
 *   post:
 *     summary: Generate a custom ID for a resource
 *     description: Returns a 5-character custom ID containing at least 2 letters and 2 digits, unique per business for the given type.
 *     tags: [Helper]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [booking, customer, team, vendor, task]
 *     responses:
 *       200:
 *         description: Custom ID generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 type:
 *                   type: string
 *                   example: booking
 *                 customId:
 *                   type: string
 *                   example: A1B2C
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Failed to generate custom ID
 */
router.post('/custom-id', generateCustomId);

export default router;
