import {
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    createTeam,
    bulkUploadTeams,
    downloadBulkUploadTemplate
} from "../controllers/team";

import express from "express";
import { handleDocumentUploadError } from "../middleware/documentUpload";
import { handleUploadError, uploadSingleFile } from "../middleware/upload";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management endpoints
 */

/**
 * @swagger
 * /team/get-all-teams:
 *   get:
 *     summary: Get all team members
 *     description: Retrieve all team members with populated role information
 *     tags: [Teams]
 *     security:
 *       - karvaanToken: []
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 *       500:
 *         description: Failed to fetch teams
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/get-all-teams", getTeams);

/**
 * @swagger
 * /team/get-team/{id}:
 *   get:
 *     summary: Get team member by ID
 *     description: Retrieve a specific team member by ID with populated role information
 *     tags: [Teams]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member ID
 *     responses:
 *       200:
 *         description: Team member retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch team member by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/get-team/:id", getTeamById);

/**
 * @swagger
 * /team/create-team:
 *   post:
 *     summary: Create a new team member
 *     description: Create a new team member record with optional document uploads (max 3)
 *     tags: [Teams]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Alice Brown"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice.brown@cooncierge.com"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               alias:
 *                 type: string
 *                 example: "Alice"
 *               designation:
 *                 type: string
 *                 example: "Travel Consultant"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               emergencyContact:
 *                 type: string
 *               dateOfJoining:
 *                 type: string
 *                 format: date
 *               dateOfLeaving:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Former, Current]
 *                 example: "Current"
 *               remarks:
 *                 type: string
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 3 document files (PDF, images, DOC, DOCX, XLS, XLSX, TXT). Max 5MB each.
 *     responses:
 *       201:
 *         description: Team member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         description: Validation error (too many documents, invalid file type, etc.)
 *       500:
 *         description: Failed to create team member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/create-team", handleDocumentUploadError, createTeam);

/**
 * @swagger
 * /team/update-team/{id}:
 *   put:
 *     summary: Update a team member
 *     description: Update an existing team member by ID
 *     tags: [Teams]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member ID to update
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
 *               alias:
 *                 type: string
 *               designation:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               emergencyContact:
 *                 type: string
 *               dateOfJoining:
 *                 type: string
 *                 format: date
 *               dateOfLeaving:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Former, Current]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Team member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to update team member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/update-team/:id", updateTeam);

/**
 * @swagger
 * /team/delete-team/{id}:
 *   delete:
 *     summary: Delete a team member
 *     description: Delete a team member by ID
 *     tags: [Teams]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member ID to delete
 *     responses:
 *       200:
 *         description: Team member deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team deleted"
 *       404:
 *         description: Team member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to delete team member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/delete-team/:id", deleteTeam);

/**
 * @swagger
 * /team/bulk-upload:
 *   post:
 *     summary: Bulk upload team members from CSV or XLSX
 *     description: Upload a CSV or XLSX file (field name: `file`) to create multiple team members.
 *     tags: [Teams]
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
 *                 description: CSV or XLSX file with team data
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
router.post('/bulk-upload', uploadSingleFile, handleUploadError, bulkUploadTeams);

/**
 * @swagger
 * /team/bulk-upload-template/{format}:
 *   get:
 *     summary: Download team bulk upload template
 *     description: Download a sample CSV or XLSX template for team bulk upload.
 *     tags: [Teams]
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

export default router;
