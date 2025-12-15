import {
    getVendors,
    getVendorById,
    updateVendor,
    deleteVendor,
    createVendor,
    mergeVendors,
    downloadBulkUploadTemplate,
    bulkUploadVendors
} from "../controllers/vendor";

import express from "express";
import { handleDocumentUploadError } from "../middleware/documentUpload";
import { handleUploadError, uploadSingleFile } from "../middleware/upload";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vendors
 *   description: Vendor management endpoints
 */

/**
 * @swagger
 * /vendor/get-all-vendors:
 *   get:
 *     summary: Get all vendors
 *     description: Retrieve all vendors. For business users, results are scoped to their business.
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter by deletion status (true to include only deleted vendors)
 *     responses:
 *       200:
 *         description: Vendors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vendors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vendor'
 *       500:
 *         description: Failed to fetch vendors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/get-all-vendors", getVendors);

/**
 * @swagger
 * /vendor/get-vendor/{id}:
 *   get:
 *     summary: Get vendor by ID
 *     description: Retrieve a specific vendor by ID
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vendor:
 *                   $ref: '#/components/schemas/Vendor'
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch vendor by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/get-vendor/:id", getVendorById);

/**
 * @swagger
 * /vendor/create-vendor:
 *   post:
 *     summary: Create a new vendor
 *     description: Create a new vendor record with optional document uploads (max 3)
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [companyName, contactPerson, email, phone]
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: "ABC Travel Services"
 *               contactPerson:
 *                 type: string
 *                 example: "Bob Johnson"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contact@abctravel.com"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               alias:
 *                 type: string
 *                 example: "ABC"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1985-07-20"
 *               openingBalance:
 *                 type: number
 *                 example: 5000
 *               balanceType:
 *                 type: string
 *                 enum: [credit, debit]
 *               GSTIN:
 *                 type: string
 *                 example: "22AAAAA0000A1Z5"
 *               address:
 *                 type: string
 *                 example: "456 Business Ave, City, State"
 *               tier:
 *                 type: string
 *                 enum: [tier1, tier2, tier3, tier4, tier5]
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 3 document files (PDF, images, DOC, DOCX, XLS, XLSX, TXT). Max 5MB each.
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vendor:
 *                   $ref: '#/components/schemas/Vendor'
 *       400:
 *         description: Validation error (too many documents, invalid file type, etc.)
 *       500:
 *         description: Failed to create vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/create-vendor", handleDocumentUploadError, createVendor);

/**
 * @swagger
 * /vendor/update-vendor/{id}:
 *   put:
 *     summary: Update a vendor
 *     description: Update an existing vendor by ID
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               GSTIN:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vendor:
 *                   $ref: '#/components/schemas/Vendor'
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to update vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/update-vendor/:id", updateVendor);

/**
 * @swagger
 * /vendor/delete-vendor/{id}:
 *   delete:
 *     summary: Delete a vendor
 *     description: Delete a vendor by ID
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID to delete
 *     responses:
 *       200:
 *         description: Vendor deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vendor deleted"
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to delete vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/delete-vendor/:id", deleteVendor);

/**
 * @swagger
 * /vendor/bulk-upload:
 *   post:
 *     summary: Bulk upload vendors from CSV or XLSX
 *     description: Upload a CSV or XLSX file (field name: `file`) to create multiple vendors at once.
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or XLSX file with vendor data
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Bulk upload completed (may contain errors)
 *       400:
 *         description: Validation error or parse failure
 *       500:
 *         description: Failed to process bulk upload
 */
router.post('/bulk-upload', uploadSingleFile, handleUploadError, bulkUploadVendors);

/**
 * @swagger
 * /vendor/bulk-upload-template/{format}:
 *   get:
 *     summary: Download vendor bulk upload template
 *     description: Download a sample CSV or XLSX template for vendor bulk upload.
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *         description: File format to download
 *     responses:
 *       200:
 *         description: Template file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid format
 *       500:
 *         description: Failed to generate template
 */
router.get('/bulk-upload-template/:format', downloadBulkUploadTemplate);

/**
 * @swagger
 * /vendor/merge-vendors:
 *   post:
 *     summary: Merge vendors
 *     description: Moves all quotations from the secondary vendor IDs to the primary vendor ID.
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - primaryVendorId
 *               - secondaryVendorsId
 *             properties:
 *               primaryVendorId:
 *                 type: string
 *                 description: Vendor ID that will remain after merge
 *               secondaryVendorsId:
 *                 type: array
 *                 description: Vendor IDs to merge into the primary vendor
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Vendors merged successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Failed to merge vendors
 */
router.post('/merge-vendors', mergeVendors);

export default router;
