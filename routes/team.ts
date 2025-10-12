import { 
    getTeams, 
    getTeamById, 
    updateTeam, 
    deleteTeam, 
    createTeam 
} from "../controllers/team";

import express from "express";

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
 *     description: Create a new team member record
 *     tags: [Teams]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, roleId]
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
 *               address:
 *                 type: string
 *                 example: "789 Office St, City, State"
 *               roleId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
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
 *       500:
 *         description: Failed to create team member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/create-team", createTeam);

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
 *               address:
 *                 type: string
 *               roleId:
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

export default router;