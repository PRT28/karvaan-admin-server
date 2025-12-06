import {
    getAllQuotations,
    getQuotationsByParty,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotationById,
    getBookingHistoryByCustomer,
    getBookingHistoryByVendor,
    getBookingHistoryByTraveller,
    getBookingHistoryByTeamMember
} from '../controllers/quotation';

import express from 'express';
import { handleDocumentUploadError } from '../middleware/documentUpload';

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
 *     summary: Create a new quotation with optional documents
 *     description: Create a new quotation record with up to 3 document uploads (PDF, images, DOC, XLS, TXT)
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [quotationType, channel, formFields, totalAmount, owner, travelDate]
 *             properties:
 *               quotationType:
 *                 type: string
 *                 enum: [flight, train, hotel, activity, travel, transport-land, transport-maritime, tickets, travel insurance, visas, others]
 *                 example: "flight"
 *               channel:
 *                 type: string
 *                 enum: [B2B, B2C]
 *                 example: "B2C"
 *               customerId:
 *                 type: string
 *                 description: Required for B2C channel
 *                 example: "507f1f77bcf86cd799439013"
 *               vendorId:
 *                 type: string
 *                 description: Required for B2B channel
 *                 example: "507f1f77bcf86cd799439014"
 *               formFields:
 *                 type: string
 *                 description: JSON stringified form fields object
 *                 example: '{"departure": "New York", "destination": "London"}'
 *               totalAmount:
 *                 type: number
 *                 example: 1500.00
 *               owner:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of team member IDs
 *               travelDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-25"
 *               travelers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of traveller IDs
 *               adultTravlers:
 *                 type: integer
 *                 example: 2
 *               childTravlers:
 *                 type: integer
 *                 example: 1
 *               remarks:
 *                 type: string
 *                 example: "Special requirements noted"
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 3 documents (max 5MB each). Allowed types - PDF, JPG, PNG, GIF, WEBP, DOC, DOCX, XLS, XLSX, TXT
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
 *       400:
 *         description: Invalid request or too many documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to create quotation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-quotation', handleDocumentUploadError, createQuotation);

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
 *                 enum: [pending, confirmed, cancelled]
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

/**
 * @swagger
 * /quotation/booking-history/customer/{customerId}:
 *   get:
 *     summary: Get booking history by customer
 *     description: |
 *       Retrieve booking history (quotations) for a specific customer with filtering and pagination options.
 *
 *       **Features:**
 *       - Filter by status, quotation type, and date ranges
 *       - Pagination support
 *       - Sorting options
 *       - Populated customer, vendor, traveller, and owner details
 *
 *       **Query Parameters:**
 *       - status: Filter by quotation status (draft, confirmed, cancelled)
 *       - quotationType: Filter by type (flight, train, hotel, activity, etc.)
 *       - startDate/endDate: Filter by booking date range
 *       - travelStartDate/travelEndDate: Filter by travel date range
 *       - sortBy: Sort field (default: createdAt)
 *       - sortOrder: Sort direction (asc/desc, default: desc)
 *       - page: Page number (default: 1)
 *       - limit: Items per page (default: 10)
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID to get booking history for
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Filter by quotation status
 *       - in: query
 *         name: quotationType
 *         schema:
 *           type: string
 *           enum: [flight, train, hotel, activity, travel, transport-land, transport-maritime, tickets, travel insurance, visas, others]
 *         description: Filter by quotation type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for booking date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for booking date filter (YYYY-MM-DD)
 *       - in: query
 *         name: travelStartDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for travel date filter (YYYY-MM-DD)
 *       - in: query
 *         name: travelEndDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for travel date filter (YYYY-MM-DD)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Booking history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     quotations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Quotation'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalCount:
 *                           type: integer
 *                           example: 47
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                     customer:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         companyName:
 *                           type: string
 *       400:
 *         description: Invalid customer ID
 *       403:
 *         description: Forbidden - cannot access customer from other business
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
router.get('/booking-history/customer/:customerId', getBookingHistoryByCustomer);

/**
 * @swagger
 * /quotation/booking-history/vendor/{vendorId}:
 *   get:
 *     summary: Get booking history by vendor
 *     description: |
 *       Retrieve booking history (quotations) for a specific vendor with filtering and pagination options.
 *
 *       **Features:**
 *       - Filter by status, quotation type, and date ranges
 *       - Pagination support
 *       - Sorting options
 *       - Populated customer, vendor, traveller, and owner details
 *
 *       **Query Parameters:**
 *       - status: Filter by quotation status (draft, confirmed, cancelled)
 *       - quotationType: Filter by type (flight, train, hotel, activity, etc.)
 *       - startDate/endDate: Filter by booking date range
 *       - travelStartDate/travelEndDate: Filter by travel date range
 *       - sortBy: Sort field (default: createdAt)
 *       - sortOrder: Sort direction (asc/desc, default: desc)
 *       - page: Page number (default: 1)
 *       - limit: Items per page (default: 10)
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID to get booking history for
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Filter by quotation status
 *       - in: query
 *         name: quotationType
 *         schema:
 *           type: string
 *           enum: [flight, train, hotel, activity, travel, transport-land, transport-maritime, tickets, travel insurance, visas, others]
 *         description: Filter by quotation type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for booking date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for booking date filter (YYYY-MM-DD)
 *       - in: query
 *         name: travelStartDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for travel date filter (YYYY-MM-DD)
 *       - in: query
 *         name: travelEndDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for travel date filter (YYYY-MM-DD)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Booking history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     quotations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Quotation'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalCount:
 *                           type: integer
 *                           example: 47
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                     vendor:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         companyName:
 *                           type: string
 *                         contactPerson:
 *                           type: string
 *                         email:
 *                           type: string
 *       400:
 *         description: Invalid vendor ID
 *       403:
 *         description: Forbidden - cannot access vendor from other business
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Internal server error
 */
router.get('/booking-history/vendor/:vendorId', getBookingHistoryByVendor);

/**
 * @swagger
 * /quotation/booking-history/traveller/{travellerId}:
 *   get:
 *     summary: Get booking history by traveller
 *     description: |
 *       Retrieve booking history (quotations) for a specific traveller with filtering and pagination options.
 *       This endpoint searches for quotations where the traveller is included in the travelers array.
 *
 *       **Features:**
 *       - Filter by status, quotation type, and date ranges
 *       - Pagination support
 *       - Sorting options
 *       - Populated customer, vendor, traveller, and owner details
 *
 *       **Query Parameters:**
 *       - status: Filter by quotation status (draft, confirmed, cancelled)
 *       - quotationType: Filter by type (flight, train, hotel, activity, etc.)
 *       - startDate/endDate: Filter by booking date range
 *       - travelStartDate/travelEndDate: Filter by travel date range
 *       - sortBy: Sort field (default: createdAt)
 *       - sortOrder: Sort direction (asc/desc, default: desc)
 *       - page: Page number (default: 1)
 *       - limit: Items per page (default: 10)
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: travellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Traveller ID to get booking history for
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Filter by quotation status
 *       - in: query
 *         name: quotationType
 *         schema:
 *           type: string
 *           enum: [flight, train, hotel, activity, travel, transport-land, transport-maritime, tickets, travel insurance, visas, others]
 *         description: Filter by quotation type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for booking date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for booking date filter (YYYY-MM-DD)
 *       - in: query
 *         name: travelStartDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for travel date filter (YYYY-MM-DD)
 *       - in: query
 *         name: travelEndDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for travel date filter (YYYY-MM-DD)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Booking history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     quotations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Quotation'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalCount:
 *                           type: integer
 *                           example: 47
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                     traveller:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *       400:
 *         description: Invalid traveller ID
 *       403:
 *         description: Forbidden - cannot access traveller from other business
 *       404:
 *         description: Traveller not found
 *       500:
 *         description: Internal server error
 */
router.get('/booking-history/traveller/:travellerId', getBookingHistoryByTraveller);

/**
 * @swagger
 * /quotation/booking-history/team-member/{teamMemberId}:
 *   get:
 *     summary: Get booking history by team member
 *     description: |
 *       Retrieve booking history (quotations) for a specific team member based on their ownership.
 *       This endpoint searches for quotations where the team member is included in the owner array.
 *
 *       **Features:**
 *       - Business-scoped access control
 *       - Advanced filtering by status, quotation type, and date ranges
 *       - Pagination support with configurable page size
 *       - Flexible sorting options
 *       - Complete data population for related entities
 *
 *       **Query Parameters:**
 *       - `status`: Filter by quotation status (draft, confirmed, cancelled)
 *       - `quotationType`: Filter by quotation type (flight, hotel, train, etc.)
 *       - `startDate` & `endDate`: Filter by booking date range (createdAt)
 *       - `travelStartDate` & `travelEndDate`: Filter by travel date range
 *       - `sortBy`: Sort field (default: createdAt)
 *       - `sortOrder`: Sort direction - asc or desc (default: desc)
 *       - `page`: Page number for pagination (default: 1)
 *       - `limit`: Number of records per page (default: 10)
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamMemberId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the team member to get booking history for
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Filter quotations by status
 *       - in: query
 *         name: quotationType
 *         schema:
 *           type: string
 *           enum: [flight, train, hotel, activity, travel, transport-land, transport-maritime, tickets, travel insurance, visas, others]
 *         description: Filter quotations by type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter quotations created on or after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter quotations created on or before this date
 *       - in: query
 *         name: travelStartDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter quotations with travel date on or after this date
 *       - in: query
 *         name: travelEndDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter quotations with travel date on or before this date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Team member booking history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     quotations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Quotation'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                     teamMember:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *       400:
 *         description: Invalid team member ID
 *       403:
 *         description: Forbidden - Cannot access team member from other business
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Internal server error
 */
router.get('/booking-history/team-member/:teamMemberId', getBookingHistoryByTeamMember);

export default router;
