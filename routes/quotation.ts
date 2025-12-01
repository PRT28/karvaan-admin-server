import {
    getAllQuotations,
    getQuotationsByParty,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotationById,
    getBookingHistoryByCustomer,
    getBookingHistoryByVendor,
    getBookingHistoryByTraveller
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
 *           enum: [draft, confirmed, cancelled]
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
 *           enum: [draft, confirmed, cancelled]
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
 *           enum: [draft, confirmed, cancelled]
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

export default router;
