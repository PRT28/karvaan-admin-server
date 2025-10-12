import { 
    getVendors, 
    getVendorById, 
    updateVendor, 
    deleteVendor, 
    createVendor 
} from "../controllers/vendor";

import express from "express";

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
 *     description: Retrieve all vendors
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
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
 *     description: Create a new vendor record
 *     tags: [Vendors]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
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
 *               GSTIN:
 *                 type: string
 *                 example: "22AAAAA0000A1Z5"
 *               address:
 *                 type: string
 *                 example: "456 Business Ave, City, State"
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
 *       500:
 *         description: Failed to create vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/create-vendor", createVendor);

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

export default router;