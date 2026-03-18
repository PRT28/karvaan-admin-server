import {
    getAllQuotations,
    getMyQuotations,
    getQuotationsByParty,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotationById,
    getBookingHistoryByCustomer,
    getBookingHistoryByVendor,
    getBookingHistoryByTraveller,
    getBookingHistoryByTeamMember,
    denyQuotation,
    approveQuotation
} from '../controllers/quotation';

import express from 'express';
import { handleDocumentUploadError } from '../middleware/documentUpload';
import { checkKarvaanToken } from '../utils/middleware';

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
 *     parameters:
 *       - in: query
 *         name: bookingStartDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by quotation createdAt start date
 *       - in: query
 *         name: bookingEndDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by quotation createdAt end date
 *       - in: query
 *         name: travelStartDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by travelDate start date
 *       - in: query
 *         name: travelEndDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by travelDate end date
 *       - in: query
 *         name: primaryOwner
 *         schema:
 *           type: string
 *         description: Filter by primary owner team member ID
 *       - in: query
 *         name: secondaryOwner
 *         schema:
 *           type: string
 *         description: Filter by secondary owner team member ID
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *         description: Include soft-deleted records when true
 *       - in: query
 *         name: serviceStatus
 *         schema:
 *           type: string
 *           enum: [pending, denied, draft, approved]
 *         description: Filter by service status
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
 * /quotation/get-my-quotations:
 *   get:
 *     summary: Get quotations owned by the logged-in user
 *     description: Returns quotations where the authenticated user is primaryOwner or in secondaryOwner. Supports pagination, date and status filters.
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: query
 *         name: bookingStartDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by createdAt start date
 *       - in: query
 *         name: bookingEndDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by createdAt end date
 *       - in: query
 *         name: travelStartDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by travelDate start date
 *       - in: query
 *         name: travelEndDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by travelDate end date
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *         description: Include soft-deleted records when true
 *       - in: query
 *         name: serviceStatus
 *         schema:
 *           type: string
 *           enum: [pending, denied, draft, approved]
 *         description: Filter by service status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Records per page (max 100)
 *     responses:
 *       200:
 *         description: Quotations retrieved successfully
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to fetch quotations
 */
router.get('/get-my-quotations', getMyQuotations);

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
 *     description: Retrieve all quotations for a specific business ID
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
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
 *     description: Create a new quotation record. For flight quotations, use top-level formFields.segments for one way and round trip bookings, and formFields.trips[].segments[] for multi city bookings. Booking and travel dates live on the quotation itself, while each monetary priceInfo field carries its own amount/currency metadata.
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [quotationType, channel, formFields, totalAmount, travelDate]
 *             properties:
 *               quotationType:
 *                 type: string
 *                 enum: [flight, accomodation, transportation, ticket, activity, travel insurance, visa, others]
 *                 example: "flight"
 *               channel:
 *                 type: string
 *                 enum: [B2B, B2C]
 *                 example: "B2C"
 *               serviceStatus:
 *                 type: string
 *                 enum: [pending, denied, draft, approved]
 *                 description: Use "draft" to skip required fields validation
 *               customerId:
 *                 oneOf:
 *                   - type: string
 *                     description: Single customer ID
 *                   - type: array
 *                     items:
 *                       type: string
 *                     description: Multiple customer IDs
 *                 example: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439099"]
 *               customerPricing:
 *                 type: string
 *                 description: JSON stringified array of per-customer selling prices
 *                 example: '[{"customerId":"507f1f77bcf86cd799439013","sellingPrice":12000},{"customerId":"507f1f77bcf86cd799439099","sellingPrice":9000}]'
 *               vendorId:
 *                 type: string
 *                 description: Vendor ID
 *                 example: "507f1f77bcf86cd799439014"
 *               formFields:
 *                 type: string
 *                 description: JSON stringified form fields object. For flight quotations use tripType, optional shared PNR, and either top-level segments (one way/round trip) or trips with nested segments (multi city).
 *                 example: '{"pnr":"AB12CD","samePnrForAllSegments":true,"tripType":"multi city","trips":[{"title":"Trip 1","segments":[{"pnr":"AB12CD","from":"DEL","to":"DXB","flightNumber":"EK51","travelDate":"2026-04-18T00:00:00.000Z","cabinClass":"Economy","cabinBaggage":{"pieces":1,"weight":7},"checkInBaggage":{"pieces":1,"weight":20},"preview":{"airline":"Emirates","airlineLogo":"https://cdn.example.com/emirates.png","flightNumber":"EK51","originAirportCode":"DEL","destinationAirportCode":"DXB","originCity":"Delhi","destinationCity":"Dubai","std":"09:45","sta":"12:30","duration":"03 h 45 m"}},{"pnr":"AB12CD","from":"DXB","to":"JFK","flightNumber":"EK203","travelDate":"2026-04-19T00:00:00.000Z","cabinClass":"Economy","cabinBaggage":{"pieces":1,"weight":7},"checkInBaggage":{"pieces":2,"weight":23}}]},{"title":"Trip 2","segments":[{"pnr":"AB12CD","from":"JFK","to":"LAX","flightNumber":"AA17","travelDate":"2026-04-23T00:00:00.000Z","cabinClass":"Business","cabinBaggage":{"pieces":2,"weight":10},"checkInBaggage":{"pieces":2,"weight":23}}]}],"rulesAndConditions":"Standard fare rules apply.","rulesTemplateId":"65f1b6f8d1a1111111111111","internalNotes":"Customer requested aisle seat."}'
 *               priceInfo:
 *                 type: string
 *                 description: JSON stringified pricing details. Each monetary field is a PriceInfoCurrencyValue object with amount, currency, exchangeRate and optional notes.
 *                 example: '{"advancedPricing":true,"sellingPrice":{"amount":21000,"currency":"USD","exchangeRate":83.10},"costPrice":{"amount":17000,"currency":"AED","exchangeRate":22.64},"vendorInvoiceBase":{"amount":16000,"currency":"AED","exchangeRate":22.64},"vendorIncentiveReceived":{"amount":500,"currency":"AED","exchangeRate":22.64},"commissionPayout":{"amount":500,"currency":"INR","exchangeRate":1},"refundReceived":{"amount":0,"currency":"AED","exchangeRate":22.64},"refundPaid":{"amount":0,"currency":"USD","exchangeRate":83.10},"vendorIncentiveChargeback":{"amount":0,"currency":"AED","exchangeRate":22.64},"commissionPayoutChargeback":{"amount":0,"currency":"INR","exchangeRate":1},"additionalCostPrice":{"amount":0,"currency":"AED","exchangeRate":22.64},"additionalSellingPrice":{"amount":0,"currency":"USD","exchangeRate":83.10},"additionalVendorInvoiceBase":{"amount":0,"currency":"AED","exchangeRate":22.64},"additionalVendorIncentiveReceived":{"amount":0,"currency":"AED","exchangeRate":22.64},"additionalCommissionPayout":{"amount":0,"currency":"INR","exchangeRate":1},"notes":"Issue ticket after passport recheck."}'
 *               bookingDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-05"
 *               newBookingDate:
 *                 type: string
 *                 format: date
 *                 description: Required when status is rescheduled
 *               newTravelDate:
 *                 type: string
 *                 format: date
 *                 description: Required when status is rescheduled
 *               cancellationDate:
 *                 type: string
 *                 format: date
 *                 description: Required when status is cancelled
 *               totalAmount:
 *                 type: number
 *                 example: 1500.00
 *               status:
 *                 type: string
 *                 enum: [confirmed, cancelled, rescheduled]
 *                 example: "confirmed"
 *               primaryOwner:
 *                 type: string
 *                 description: Primary owner team member ID
 *               secondaryOwner:
 *                 type: string
 *                 description: JSON stringified array of secondary owner IDs
 *                 example: '["507f1f77bcf86cd799439016"]'
 *               travelDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-18"
 *               adultTravelers:
 *                 type: string
 *                 description: JSON stringified array of adult traveller IDs
 *                 example: '["507f1f77bcf86cd799439022"]'
 *               childTravelers:
 *                 type: string
 *                 description: JSON stringified array of child traveller objects
 *                 example: '[{"id":"507f1f77bcf86cd799439023","age":8}]'
 *               adultNumber:
 *                 type: integer
 *                 example: 2
 *               childNumber:
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
 *               vendorVoucherDocuments:
 *                 type: string
 *                 description: JSON stringified array of uploaded vendor voucher document metadata, maximum 3 entries
 *                 example: '[{"originalName":"voucher.pdf","fileName":"voucher-1.pdf","url":"https://cdn.example.com/voucher-1.pdf","key":"quotations/vendor-voucher-1.pdf","size":120455,"mimeType":"application/pdf","uploadedAt":"2026-03-05T10:00:00.000Z"}]'
 *               vendorInvoiceDocuments:
 *                 type: string
 *                 description: JSON stringified array of uploaded vendor invoice document metadata, maximum 3 entries
 *                 example: '[{"originalName":"invoice.pdf","fileName":"invoice-1.pdf","url":"https://cdn.example.com/invoice-1.pdf","key":"quotations/vendor-invoice-1.pdf","size":98455,"mimeType":"application/pdf","uploadedAt":"2026-03-05T10:05:00.000Z"}]'
 *           examples:
 *             createFlightQuotation:
 *               summary: Create confirmed multi-city flight quotation
 *               value:
 *                 quotationType: "flight"
 *                 channel: "B2C"
 *                 serviceStatus: "approved"
 *                 customerId: ["507f1f77bcf86cd799439013"]
 *                 customerPricing: '[{"customerId":"507f1f77bcf86cd799439013","sellingPrice":21000}]'
 *                 vendorId: "507f1f77bcf86cd799439014"
 *                 formFields: '{"pnr":"AB12CD","samePnrForAllSegments":true,"tripType":"multi city","trips":[{"title":"Trip 1","segments":[{"pnr":"AB12CD","from":"DEL","to":"DXB","flightNumber":"EK51","travelDate":"2026-04-18T00:00:00.000Z","cabinClass":"Economy","cabinBaggage":{"pieces":1,"weight":7},"checkInBaggage":{"pieces":1,"weight":20},"preview":{"airline":"Emirates","airlineLogo":"https://cdn.example.com/emirates.png","flightNumber":"EK51","originAirportCode":"DEL","destinationAirportCode":"DXB","originCity":"Delhi","destinationCity":"Dubai","std":"09:45","sta":"12:30","duration":"03 h 45 m"}},{"pnr":"AB12CD","from":"DXB","to":"JFK","flightNumber":"EK203","travelDate":"2026-04-19T00:00:00.000Z","cabinClass":"Economy","cabinBaggage":{"pieces":1,"weight":7},"checkInBaggage":{"pieces":2,"weight":23}}]},{"title":"Trip 2","segments":[{"pnr":"AB12CD","from":"JFK","to":"LAX","flightNumber":"AA17","travelDate":"2026-04-23T00:00:00.000Z","cabinClass":"Business","cabinBaggage":{"pieces":2,"weight":10},"checkInBaggage":{"pieces":2,"weight":23}}]}],"rulesAndConditions":"Standard fare rules apply.","rulesTemplateId":"65f1b6f8d1a1111111111111","internalNotes":"Customer requested aisle seat."}'
 *                 priceInfo: '{"advancedPricing":true,"sellingPrice":{"amount":21000,"currency":"USD","exchangeRate":83.10},"costPrice":{"amount":17000,"currency":"AED","exchangeRate":22.64},"vendorInvoiceBase":{"amount":16000,"currency":"AED","exchangeRate":22.64},"vendorIncentiveReceived":{"amount":500,"currency":"AED","exchangeRate":22.64},"commissionPayout":{"amount":500,"currency":"INR","exchangeRate":1},"refundReceived":{"amount":0,"currency":"AED","exchangeRate":22.64},"refundPaid":{"amount":0,"currency":"USD","exchangeRate":83.10},"vendorIncentiveChargeback":{"amount":0,"currency":"AED","exchangeRate":22.64},"commissionPayoutChargeback":{"amount":0,"currency":"INR","exchangeRate":1},"additionalCostPrice":{"amount":0,"currency":"AED","exchangeRate":22.64},"additionalSellingPrice":{"amount":0,"currency":"USD","exchangeRate":83.10},"additionalVendorInvoiceBase":{"amount":0,"currency":"AED","exchangeRate":22.64},"additionalVendorIncentiveReceived":{"amount":0,"currency":"AED","exchangeRate":22.64},"additionalCommissionPayout":{"amount":0,"currency":"INR","exchangeRate":1},"notes":"Issue ticket after passport recheck."}'
 *                 bookingDate: "2026-03-05"
 *                 totalAmount: 21000
 *                 status: "confirmed"
 *                 primaryOwner: "507f1f77bcf86cd799439016"
 *                 secondaryOwner: '["507f1f77bcf86cd799439018"]'
 *                 travelDate: "2026-04-18"
 *                 adultNumber: 2
 *                 childNumber: 0
 *                 remarks: "Send final itinerary once ticketed."
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
 *             examples:
 *               createdFlightQuotation:
 *                 summary: Created quotation response
 *                 value:
 *                   success: true
 *                   quotation:
 *                     _id: "507f1f77bcf86cd799439017"
 *                     customId: "LM12N"
 *                     quotationType: "flight"
 *                     channel: "B2C"
 *                     businessId: "507f1f77bcf86cd799439020"
 *                     customerId: ["507f1f77bcf86cd799439013"]
 *                     customerPricing:
 *                       - customerId: "507f1f77bcf86cd799439013"
 *                         sellingPrice: 21000
 *                     vendorId: "507f1f77bcf86cd799439014"
 *                     formFields:
 *                       pnr: "AB12CD"
 *                       samePnrForAllSegments: true
 *                       tripType: "multi city"
 *                       trips:
 *                         - title: "Trip 1"
 *                           segments:
 *                             - pnr: "AB12CD"
 *                               from: "DEL"
 *                               to: "DXB"
 *                               flightNumber: "EK51"
 *                               travelDate: "2026-04-18T00:00:00.000Z"
 *                               cabinClass: "Economy"
 *                               cabinBaggage:
 *                                 pieces: 1
 *                                 weight: 7
 *                               checkInBaggage:
 *                                 pieces: 1
 *                                 weight: 20
 *                               preview:
 *                                 airline: "Emirates"
 *                                 airlineLogo: "https://cdn.example.com/emirates.png"
 *                                 flightNumber: "EK51"
 *                                 originAirportCode: "DEL"
 *                                 destinationAirportCode: "DXB"
 *                                 originCity: "Delhi"
 *                                 destinationCity: "Dubai"
 *                                 std: "09:45"
 *                                 sta: "12:30"
 *                                 duration: "03 h 45 m"
 *                             - pnr: "AB12CD"
 *                               from: "DXB"
 *                               to: "JFK"
 *                               flightNumber: "EK203"
 *                               travelDate: "2026-04-19T00:00:00.000Z"
 *                               cabinClass: "Economy"
 *                               cabinBaggage:
 *                                 pieces: 1
 *                                 weight: 7
 *                               checkInBaggage:
 *                                 pieces: 2
 *                                 weight: 23
 *                         - title: "Trip 2"
 *                           segments:
 *                             - pnr: "AB12CD"
 *                               from: "JFK"
 *                               to: "LAX"
 *                               flightNumber: "AA17"
 *                               travelDate: "2026-04-23T00:00:00.000Z"
 *                               cabinClass: "Business"
 *                               cabinBaggage:
 *                                 pieces: 2
 *                                 weight: 10
 *                               checkInBaggage:
 *                                 pieces: 2
 *                                 weight: 23
 *                       rulesAndConditions: "Standard fare rules apply."
 *                       rulesTemplateId: "65f1b6f8d1a1111111111111"
 *                       internalNotes: "Customer requested aisle seat."
 *                     priceInfo:
 *                       advancedPricing: true
 *                       sellingPrice:
 *                         amount: 21000
 *                         currency: "USD"
 *                         exchangeRate: 83.1
 *                       costPrice:
 *                         amount: 17000
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       vendorInvoiceBase:
 *                         amount: 16000
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       vendorIncentiveReceived:
 *                         amount: 500
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       commissionPayout:
 *                         amount: 500
 *                         currency: "INR"
 *                         exchangeRate: 1
 *                       additionalVendorInvoiceBase:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       refundReceived:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       refundPaid:
 *                         amount: 0
 *                         currency: "USD"
 *                         exchangeRate: 83.1
 *                       vendorIncentiveChargeback:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       commissionPayoutChargeback:
 *                         amount: 0
 *                         currency: "INR"
 *                         exchangeRate: 1
 *                       additionalCostPrice:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       additionalSellingPrice:
 *                         amount: 0
 *                         currency: "USD"
 *                         exchangeRate: 83.1
 *                       additionalVendorIncentiveReceived:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       additionalCommissionPayout:
 *                         amount: 0
 *                         currency: "INR"
 *                         exchangeRate: 1
 *                       notes: "Issue ticket after passport recheck."
 *                     totalAmount: 21000
 *                     status: "confirmed"
 *                     serviceStatus: "approved"
 *                     bookingDate: "2026-03-05T00:00:00.000Z"
 *                     primaryOwner: "507f1f77bcf86cd799439016"
 *                     secondaryOwner: ["507f1f77bcf86cd799439018"]
 *                     travelDate: "2026-04-18T00:00:00.000Z"
 *                     adultNumber: 2
 *                     childNumber: 0
 *                     remarks: "Send final itinerary once ticketed."
 *                     documents: []
 *                     vendorVoucherDocuments:
 *                       - originalName: "voucher.pdf"
 *                         fileName: "voucher-1.pdf"
 *                         url: "https://cdn.example.com/voucher-1.pdf"
 *                         key: "quotations/vendor-voucher-1.pdf"
 *                         size: 120455
 *                         mimeType: "application/pdf"
 *                         uploadedAt: "2026-03-05T10:00:00.000Z"
 *                     vendorInvoiceDocuments:
 *                       - originalName: "invoice.pdf"
 *                         fileName: "invoice-1.pdf"
 *                         url: "https://cdn.example.com/invoice-1.pdf"
 *                         key: "quotations/vendor-invoice-1.pdf"
 *                         size: 98455
 *                         mimeType: "application/pdf"
 *                         uploadedAt: "2026-03-05T10:05:00.000Z"
 *                     isDeleted: false
 *                     createdAt: "2026-03-05T10:10:00.000Z"
 *                     updatedAt: "2026-03-05T10:10:00.000Z"
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
 *     description: Update an existing quotation by ID. Supports top-level segments for one way/round trip flights, trips with nested segments for multi city flights, and quotation-level new/cancel dates for cancelled/rescheduled statuses.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               quotationType:
 *                 type: string
 *                 enum: [flight, accomodation, transportation, ticket, activity, travel insurance, visa, others]
 *               channel:
 *                 type: string
 *                 enum: [B2B, B2C]
 *               customerId:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               customerPricing:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         customerId:
 *                           type: string
 *                         sellingPrice:
 *                           type: number
 *                   - type: string
 *               vendorId:
 *                 type: string
 *               primaryOwner:
 *                 type: string
 *               secondaryOwner:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: string
 *               adultTravelers:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: string
 *               childTravelers:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         age:
 *                           type: number
 *                   - type: string
 *               travelDate:
 *                 type: string
 *                 format: date
 *               bookingDate:
 *                 type: string
 *                 format: date
 *               newBookingDate:
 *                 type: string
 *                 format: date
 *               newTravelDate:
 *                 type: string
 *                 format: date
 *               cancellationDate:
 *                 type: string
 *                 format: date
 *               formFields:
 *                 oneOf:
 *                   - type: object
 *                     additionalProperties: true
 *                   - type: string
 *               priceInfo:
 *                 oneOf:
 *                   - type: object
 *                   - type: string
 *                 description: Pure pricing data only. Each monetary field is a PriceInfoCurrencyValue object.
 *               totalAmount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [confirmed, cancelled, rescheduled]
 *               serviceStatus:
 *                 type: string
 *                 enum: [pending, denied, draft, approved]
 *               remarks:
 *                 type: string
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               vendorVoucherDocuments:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: object
 *                   - type: string
 *               vendorInvoiceDocuments:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: object
 *                   - type: string
 *           examples:
 *             rescheduleFlightQuotation:
 *               summary: Reschedule a flight quotation
 *               value:
 *                 status: "rescheduled"
 *                 newBookingDate: "2026-03-08"
 *                 newTravelDate: "2026-04-20"
 *                 travelDate: "2026-04-20"
 *                 priceInfo: '{"advancedPricing":true,"sellingPrice":{"amount":22000,"currency":"USD","exchangeRate":83.10},"costPrice":{"amount":17500,"currency":"AED","exchangeRate":22.64},"vendorInvoiceBase":{"amount":16500,"currency":"AED","exchangeRate":22.64},"vendorIncentiveReceived":{"amount":500,"currency":"AED","exchangeRate":22.64},"commissionPayout":{"amount":500,"currency":"INR","exchangeRate":1},"refundReceived":{"amount":0,"currency":"AED","exchangeRate":22.64},"refundPaid":{"amount":0,"currency":"USD","exchangeRate":83.10},"vendorIncentiveChargeback":{"amount":0,"currency":"AED","exchangeRate":22.64},"commissionPayoutChargeback":{"amount":0,"currency":"INR","exchangeRate":1},"additionalCostPrice":{"amount":0,"currency":"AED","exchangeRate":22.64},"additionalSellingPrice":{"amount":1000,"currency":"USD","exchangeRate":83.10},"additionalVendorInvoiceBase":{"amount":0,"currency":"AED","exchangeRate":22.64},"additionalVendorIncentiveReceived":{"amount":0,"currency":"AED","exchangeRate":22.64},"additionalCommissionPayout":{"amount":0,"currency":"INR","exchangeRate":1},"notes":"Travel rescheduled by customer."}'
 *                 formFields: '{"pnr":"AB12CD","samePnrForAllSegments":true,"tripType":"round trip","segments":[{"pnr":"AB12CD","from":"DEL","to":"DXB","flightNumber":"EK51","travelDate":"2026-04-20T00:00:00.000Z","cabinClass":"Economy","cabinBaggage":{"pieces":1,"weight":7},"checkInBaggage":{"pieces":1,"weight":20}},{"pnr":"AB12CD","from":"DXB","to":"DEL","flightNumber":"EK52","travelDate":"2026-04-27T00:00:00.000Z","cabinClass":"Economy","cabinBaggage":{"pieces":1,"weight":7},"checkInBaggage":{"pieces":1,"weight":20}}],"internalNotes":"Dates updated after customer confirmation."}'
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
 *             examples:
 *               updatedFlightQuotation:
 *                 summary: Updated quotation response
 *                 value:
 *                   success: true
 *                   quotation:
 *                     _id: "507f1f77bcf86cd799439017"
 *                     customId: "LM12N"
 *                     quotationType: "flight"
 *                     channel: "B2C"
 *                     businessId: "507f1f77bcf86cd799439020"
 *                     customerId: ["507f1f77bcf86cd799439013"]
 *                     customerPricing:
 *                       - customerId: "507f1f77bcf86cd799439013"
 *                         sellingPrice: 22000
 *                     vendorId: "507f1f77bcf86cd799439014"
 *                     formFields:
 *                       pnr: "AB12CD"
 *                       samePnrForAllSegments: true
 *                       tripType: "round trip"
 *                       segments:
 *                         - pnr: "AB12CD"
 *                           from: "DEL"
 *                           to: "DXB"
 *                           flightNumber: "EK51"
 *                           travelDate: "2026-04-20T00:00:00.000Z"
 *                           cabinClass: "Economy"
 *                         - pnr: "AB12CD"
 *                           from: "DXB"
 *                           to: "DEL"
 *                           flightNumber: "EK52"
 *                           travelDate: "2026-04-27T00:00:00.000Z"
 *                           cabinClass: "Economy"
 *                       internalNotes: "Dates updated after customer confirmation."
 *                     priceInfo:
 *                       advancedPricing: true
 *                       sellingPrice:
 *                         amount: 22000
 *                         currency: "USD"
 *                         exchangeRate: 83.1
 *                       costPrice:
 *                         amount: 17500
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       vendorInvoiceBase:
 *                         amount: 16500
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       vendorIncentiveReceived:
 *                         amount: 500
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       commissionPayout:
 *                         amount: 500
 *                         currency: "INR"
 *                         exchangeRate: 1
 *                       additionalVendorInvoiceBase:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       refundReceived:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       refundPaid:
 *                         amount: 0
 *                         currency: "USD"
 *                         exchangeRate: 83.1
 *                       vendorIncentiveChargeback:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       commissionPayoutChargeback:
 *                         amount: 0
 *                         currency: "INR"
 *                         exchangeRate: 1
 *                       additionalCostPrice:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       additionalSellingPrice:
 *                         amount: 1000
 *                         currency: "USD"
 *                         exchangeRate: 83.1
 *                       additionalVendorIncentiveReceived:
 *                         amount: 0
 *                         currency: "AED"
 *                         exchangeRate: 22.64
 *                       additionalCommissionPayout:
 *                         amount: 0
 *                         currency: "INR"
 *                         exchangeRate: 1
 *                       notes: "Travel rescheduled by customer."
 *                     totalAmount: 22000
 *                     status: "rescheduled"
 *                     serviceStatus: "approved"
 *                     bookingDate: "2026-03-05T00:00:00.000Z"
 *                     newBookingDate: "2026-03-08T00:00:00.000Z"
 *                     newTravelDate: "2026-04-20T00:00:00.000Z"
 *                     primaryOwner: "507f1f77bcf86cd799439016"
 *                     secondaryOwner: ["507f1f77bcf86cd799439018"]
 *                     travelDate: "2026-04-20T00:00:00.000Z"
 *                     adultNumber: 2
 *                     childNumber: 0
 *                     remarks: "Customer accepted revised fare."
 *                     documents: []
 *                     vendorVoucherDocuments: []
 *                     vendorInvoiceDocuments: []
 *                     isDeleted: false
 *                     createdAt: "2026-03-05T10:10:00.000Z"
 *                     updatedAt: "2026-03-08T12:00:00.000Z"
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
router.put('/update-quotation/:id', handleDocumentUploadError, updateQuotation);

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
 *       - status: Filter by quotation status (confirmed, cancelled)
 *       - quotationType: Filter by type (flight, accomodation, transportation, ticket, activity, travel insurance, visa, others)
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
 *           enum: [confirmed, cancelled]
 *         description: Filter by quotation status
 *       - in: query
 *         name: quotationType
 *         schema:
 *           type: string
 *           enum: [flight, accomodation, transportation, ticket, activity, travel insurance, visa, others]
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
 *       - status: Filter by quotation status (confirmed, cancelled)
 *       - quotationType: Filter by type (flight, accomodation, transportation, ticket, activity, travel insurance, visa, others)
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
 *           enum: [confirmed, cancelled]
 *         description: Filter by quotation status
 *       - in: query
 *         name: quotationType
 *         schema:
 *           type: string
 *           enum: [flight, accomodation, transportation, ticket, activity, travel insurance, visa, others]
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
 *       This endpoint searches for quotations where the traveller is included in `adultTravelers` or `childTravelers.id`.
 *
 *       **Features:**
 *       - Filter by status, quotation type, and date ranges
 *       - Pagination support
 *       - Sorting options
 *       - Populated customer, vendor, traveller, and owner details
 *
 *       **Query Parameters:**
 *       - status: Filter by quotation status (confirmed, cancelled)
 *       - quotationType: Filter by type (flight, accomodation, transportation, ticket, activity, travel insurance, visa, others)
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
 *           enum: [confirmed, cancelled]
 *         description: Filter by quotation status
 *       - in: query
 *         name: quotationType
 *         schema:
 *           type: string
 *           enum: [flight, accomodation, transportation, ticket, activity, travel insurance, visa, others]
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
 *       This endpoint searches for quotations where the team member is either `primaryOwner` or included in `secondaryOwner`.
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
 *       - `quotationType`: Filter by quotation type (flight, accomodation, transportation, ticket, activity, travel insurance, visa, others)
 *       - `startDate` & `endDate`: Filter by booking date range (createdAt)
 *       - `travelStartDate` & `travelEndDate`: Filter by travel date range
 *       - `sortBy`: Sort field (default: createdAt)
 *       - `sortOrder`: Sort direction - asc or desc (default: desc)
 *       - `page`: Page number for pagination (default: 1)
 *       - `limit`: Number of records per page (default: 10)
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
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
 *           enum: [confirmed, cancelled]
 *         description: Filter quotations by status
 *       - in: query
 *         name: quotationType
 *         schema:
 *           type: string
 *           enum: [flight, accomodation, transportation, ticket, activity, travel insurance, visa, others]
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

/**
 * @swagger
 * /quotation/approve/{id}:
 *   post:
 *     summary: Approve a quotation
 *     description: Approve a quotation via maker-checker validation.
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID to approve
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Approval reason or remarks
 *     responses:
 *       200:
 *         description: Quotation approved successfully
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
 *         description: Invalid request or missing business context
 *       401:
 *         description: Unauthorized user
 *       403:
 *         description: Not authorized to approve this quotation
 *       404:
 *         description: Quotation not found
 *       500:
 *         description: Failed to approve quotation
 */
router.post('/approve/:id', checkKarvaanToken, approveQuotation);

/**
 * @swagger
 * /quotation/deny/{id}:
 *   post:
 *     summary: Deny a quotation
 *     description: Deny a quotation via maker-checker validation.
 *     tags: [Quotations]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID to deny
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Denial reason or remarks
 *     responses:
 *       200:
 *         description: Quotation denied successfully
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
 *         description: Invalid request or missing business context
 *       401:
 *         description: Unauthorized user
 *       403:
 *         description: Not authorized to deny this quotation
 *       404:
 *         description: Quotation not found
 *       500:
 *         description: Failed to deny quotation
 */
router.post('/deny/:id', checkKarvaanToken, denyQuotation);

export default router;
