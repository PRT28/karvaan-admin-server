import { 
    getCustomers, 
    getCustomerById, 
    updateCustomer, 
    deleteCustomer, 
    createCustomer 
} from "../controllers/customer";

import express from "express";

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
 *     description: Retrieve all customers with populated owner information
 *     tags: [Customers]
 *     security:
 *       - karvaanToken: []
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *     description: Create a new customer record
 *     tags: [Customers]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
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
 *                 enum: [tier1, tier2, tier3]
 *                 example: "tier1"
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
 *       500:
 *         description: Failed to create customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/create-customer", createCustomer);

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

export default router;