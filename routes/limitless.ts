import {
  getAllLimitless,
  getLimitlessByParty,
  createLimitless,
  updateLimitless,
  deleteLimitless,
  getLimitlessById,
  getLimitlessHistoryByCustomer,
  getLimitlessHistoryByTraveller,
  getLimitlessHistoryByTeamMember,
  approveLimitless,
  denyLimitless,
} from '../controllers/limitless';

import express from 'express';
import { handleDocumentUploadError } from '../middleware/documentUpload';
import { checkKarvaanToken } from '../utils/middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Limitless
 *   description: Limitless booking management endpoints
 */

/**
 * @swagger
 * /limitless/get-all-limitless:
 *   get:
 *     summary: Get all limitless bookings
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: query
 *         name: bookingStartDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: bookingEndDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: travelStartDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: travelEndDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: primaryOwner
 *         schema:
 *           type: string
 *       - in: query
 *         name: secondaryOwner
 *         schema:
 *           type: string
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: serviceStatus
 *         schema:
 *           type: string
 *           enum: [pending, denied, draft, approved]
 *     responses:
 *       200:
 *         description: Limitless bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 limitless:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Limitless'
 */
router.get('/get-all-limitless', getAllLimitless);

/**
 * @swagger
 * /limitless/get-limitless/{id}:
 *   get:
 *     summary: Get limitless booking by ID
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Limitless booking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 limitless:
 *                   $ref: '#/components/schemas/Limitless'
 *       404:
 *         description: Limitless booking not found
 */
router.get('/get-limitless/:id', getLimitlessById);

/**
 * @swagger
 * /limitless/get-limitless-by-party/{id}:
 *   get:
 *     summary: Get limitless bookings by business ID
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Limitless bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 limitless:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Limitless'
 */
router.get('/get-limitless-by-party/:id', getLimitlessByParty);

/**
 * @swagger
 * /limitless/create-limitless:
 *   post:
 *     summary: Create a new limitless booking
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               totalAmount:
 *                 type: number
 *               roe:
 *                 type: number
 *               currency:
 *                 type: string
 *               travelDate:
 *                 type: string
 *                 format: date
 *               bookingDate:
 *                 type: string
 *                 format: date
 *               primaryOwner:
 *                 type: string
 *               secondaryOwner:
 *                 type: array
 *                 items:
 *                   type: string
 *               customerId:
 *                 type: string
 *               adultTravelers:
 *                 type: array
 *                 items:
 *                   type: string
 *               childTravelers:
 *                 type: array
 *                 items:
 *                   type: string
 *               adultNumber:
 *                 type: number
 *               childNumber:
 *                 type: number
 *               limitlessDestinations:
 *                 type: array
 *                 items:
 *                   type: string
 *               limitlessTitle:
 *                 type: string
 *               description:
 *                 type: string
 *               remarks:
 *                 type: string
 *               serviceStatus:
 *                 type: string
 *                 enum: [pending, denied, draft, approved]
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Limitless booking created successfully
 */
router.post('/create-limitless', handleDocumentUploadError, createLimitless);

/**
 * @swagger
 * /limitless/update-limitless/{id}:
 *   put:
 *     summary: Update a limitless booking
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Limitless booking updated successfully
 *       404:
 *         description: Limitless booking not found
 */
router.put('/update-limitless/:id', handleDocumentUploadError, updateLimitless);

/**
 * @swagger
 * /limitless/delete-limitless/{id}:
 *   delete:
 *     summary: Delete a limitless booking
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Limitless booking deleted successfully
 */
router.delete('/delete-limitless/:id', deleteLimitless);

/**
 * @swagger
 * /limitless/booking-history/customer/{customerId}:
 *   get:
 *     summary: Get limitless history by customer
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Limitless history retrieved successfully
 */
router.get('/booking-history/customer/:customerId', getLimitlessHistoryByCustomer);

/**
 * @swagger
 * /limitless/booking-history/traveller/{travellerId}:
 *   get:
 *     summary: Get limitless history by traveller
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: travellerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Limitless history retrieved successfully
 */
router.get('/booking-history/traveller/:travellerId', getLimitlessHistoryByTraveller);

/**
 * @swagger
 * /limitless/booking-history/team-member/{teamMemberId}:
 *   get:
 *     summary: Get limitless history by team member
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: teamMemberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Limitless history retrieved successfully
 */
router.get('/booking-history/team-member/:teamMemberId', getLimitlessHistoryByTeamMember);

/**
 * @swagger
 * /limitless/approve/{id}:
 *   post:
 *     summary: Approve a limitless booking
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Limitless booking approved successfully
 */
router.post('/approve/:id', checkKarvaanToken, approveLimitless);

/**
 * @swagger
 * /limitless/deny/{id}:
 *   post:
 *     summary: Deny a limitless booking
 *     tags: [Limitless]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Limitless booking denied successfully
 */
router.post('/deny/:id', checkKarvaanToken, denyLimitless);

export default router;
