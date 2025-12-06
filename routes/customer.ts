import {
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    createCustomer,
    bulkUploadCustomers,
    downloadBulkUploadTemplate
} from "../controllers/customer";

import express from "express";
import { uploadSingleFile, handleUploadError } from "../middleware/upload";
import { handleDocumentUploadError } from "../middleware/documentUpload";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management endpoints
 */

/**
 * @swagger
 * /customer/get-all-customers:
 *   get:
 *     summary: Get all customers
 *     description: |
 *       Retrieve all customers with populated owner information.
 *
 *       **Features:**
 *       - Business-based filtering (users see only their business customers)
 *       - Soft deletion filtering
 *       - Owner information population
 *       - Multi-tenant architecture support
 *     tags: [Customers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter by deletion status (true for deleted, false for active)
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 customers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *       500:
 *         description: Failed to fetch customers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/get-all-customers", getCustomers);

/**
 * @swagger
 * /customer/get-customer/{id}:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieve a specific customer by ID with populated owner information
 *     tags: [Customers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to get customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/get-customer/:id", getCustomerById);

/**
 * @swagger
 * /customer/create-customer:
 *   post:
 *     summary: Create a new customer
 *     description: Create a new customer record with optional document uploads (max 3)
 *     tags: [Customers]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, phone, ownerId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane.smith@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               address:
 *                 type: string
 *                 example: "123 Main St, City, State"
 *               ownerId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439014"
 *               tier:
 *                 type: string
 *                 enum: [tier1, tier2, tier3, tier4, tier5]
 *                 example: "tier1"
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 3 document files (PDF, images, DOC, DOCX, XLS, XLSX, TXT). Max 5MB each.
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Validation error (too many documents, invalid file type, etc.)
 *       500:
 *         description: Failed to create customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/create-customer", handleDocumentUploadError, createCustomer);

/**
 * @swagger
 * /customer/update-customer/{id}:
 *   put:
 *     summary: Update a customer
 *     description: Update an existing customer by ID
 *     tags: [Customers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               ownerId:
 *                 type: string
 *               tier:
 *                 type: string
 *                 enum: [tier1, tier2, tier3]
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to update customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/update-customer/:id", updateCustomer);

/**
 * @swagger
 * /customer/delete-customer/{id}:
 *   delete:
 *     summary: Delete a customer
 *     description: Delete a customer by ID
 *     tags: [Customers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID to delete
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Customer deleted"
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to delete customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/delete-customer/:id", deleteCustomer);

/**
 * @swagger
 * /customer/bulk-upload:
 *   post:
 *     summary: Bulk upload customers from CSV or XLSX file
 *     description: |
 *       Upload a CSV or XLSX file to create multiple customers at once.
 *
 *       **Required columns in the file:**
 *       - name (string): Customer name
 *       - email (string): Customer email (must be unique per business)
 *       - phone (string): Customer phone number
 *       - ownerId (string): Valid ObjectId of team member who owns this customer
 *
 *       **Optional columns:**
 *       - alias (string): Customer alias/nickname
 *       - dateOfBirth (date): Customer date of birth (YYYY-MM-DD format)
 *       - gstin (string): GST identification number
 *       - companyName (string): Company name if business customer
 *       - openingBalance (number): Opening balance amount
 *       - balanceType (string): Either 'credit' or 'debit'
 *       - address (string): Customer address
 *       - tier (string): Customer tier (tier1, tier2, tier3, tier4, tier5)
 *
 *       **File Requirements:**
 *       - Maximum file size: 10MB
 *       - Supported formats: CSV (.csv), Excel (.xls, .xlsx)
 *       - Use 'file' as the form field name
 *     tags: [Customers]
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
 *                 description: CSV or XLSX file containing customer data
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Bulk upload completed successfully (some or all records processed)
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
 *                   example: "Bulk upload completed. 8 customers created successfully, 2 failed."
 *                 totalRecords:
 *                   type: integer
 *                   example: 10
 *                   description: Total number of records in the file
 *                 successfulRecords:
 *                   type: integer
 *                   example: 8
 *                   description: Number of customers created successfully
 *                 failedRecords:
 *                   type: integer
 *                   example: 2
 *                   description: Number of records that failed to process
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: integer
 *                         example: 3
 *                         description: Row number where error occurred
 *                       data:
 *                         type: object
 *                         description: The data that failed to process
 *                       error:
 *                         type: string
 *                         example: "Email already exists for this business"
 *                         description: Error message explaining why the record failed
 *                 createdCustomers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *                   description: Array of successfully created customer objects
 *       400:
 *         description: Bad request - file validation errors or no successful records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     no_file:
 *                       value: "No file uploaded. Please upload a CSV or XLSX file."
 *                     invalid_type:
 *                       value: "Invalid file type. Please upload a CSV or XLSX file."
 *                     no_data:
 *                       value: "No data found in the uploaded file."
 *                     parse_error:
 *                       value: "Failed to parse file. Please check file format and try again."
 *                     file_too_large:
 *                       value: "File too large. Maximum size allowed is 10MB."
 *                 error:
 *                   type: string
 *                   description: Additional error details (when applicable)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error during bulk upload"
 *                 error:
 *                   type: string
 *                   description: Error details
 */
router.post('/bulk-upload', uploadSingleFile, handleUploadError, bulkUploadCustomers);

/**
 * @swagger
 * /customer/bulk-upload-template/{format}:
 *   get:
 *     summary: Download bulk upload template file
 *     description: |
 *       Download a template file for bulk customer upload in the specified format.
 *       The template includes sample data and all available columns with proper formatting.
 *
 *       **Supported formats:**
 *       - csv: Comma-separated values format
 *       - xlsx: Microsoft Excel format
 *
 *       **Template includes:**
 *       - All required columns: name, email, phone, ownerId
 *       - All optional columns: alias, dateOfBirth, gstin, companyName, openingBalance, balanceType, address, tier
 *       - Sample data rows showing proper formatting
 *       - Column headers for easy identification
 *
 *       **Usage:**
 *       1. Download the template in your preferred format
 *       2. Fill in your customer data following the sample format
 *       3. Upload the completed file using POST /customer/bulk-upload
 *
 *       **Important Notes:**
 *       - Replace sample ownerId values with actual team member IDs from your business
 *       - Ensure email addresses are unique within your business
 *       - Use proper date format (YYYY-MM-DD) for dateOfBirth
 *       - Use valid tier values: tier1, tier2, tier3, tier4, tier5
 *       - Use valid balanceType values: credit, debit
 *     tags: [Customers]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *         description: Template file format (csv or xlsx)
 *         example: csv
 *     responses:
 *       200:
 *         description: Template file downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *               description: CSV template file with sample customer data
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *               description: Excel template file with sample customer data
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *               example: 'attachment; filename="customer-bulk-upload-template.csv"'
 *           Content-Type:
 *             description: File MIME type
 *             schema:
 *               type: string
 *               examples:
 *                 csv:
 *                   value: text/csv
 *                 xlsx:
 *                   value: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 *       400:
 *         description: Invalid format parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid format. Supported formats are: csv, xlsx"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error during template download"
 *                 error:
 *                   type: string
 *                   description: Error details
 */
router.get('/bulk-upload-template/:format', downloadBulkUploadTemplate);

export default router;