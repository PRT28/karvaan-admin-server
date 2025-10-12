import express from "express";
import { 
    getAllLogs,
    getUserLogsDashboard,
    createLog,
    updateLog,
    updateLogStatus,
    deleteLog,
    getUserLogsByMonth
} from "../controllers/logs";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Task logging and dashboard endpoints
 */

/**
 * @swagger
 * /logs/get-all-logs:
 *   get:
 *     summary: Get all logs
 *     description: Retrieve all logs with populated user and assignedBy information
 *     tags: [Logs]
 *     security:
 *       - karvaanToken: []
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Logs'
 *       500:
 *         description: Failed to fetch logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-all-logs', getAllLogs);

/**
 * @swagger
 * /logs/monthly-summary/{userId}:
 *   get:
 *     summary: Get user logs by month
 *     description: Retrieve logs for a specific user grouped by day for a given month
 *     tags: [Logs]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2024)
 *     responses:
 *       200:
 *         description: Monthly logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 month:
 *                   type: integer
 *                 year:
 *                   type: integer
 *                 logsByDay:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Logs'
 *       400:
 *         description: userId, month, and year are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/monthly-summary/:userId', getUserLogsByMonth);

/**
 * @swagger
 * /logs/get-user-logs/{userId}:
 *   get:
 *     summary: Get user dashboard logs
 *     description: Retrieve comprehensive dashboard data for a user including date-wise logs, status counts, recent logs, and team performance
 *     tags: [Logs]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dateWiseLogs:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Logs'
 *                 percentageLogs:
 *                   type: object
 *                   properties:
 *                     completedCount:
 *                       type: integer
 *                     completedPercent:
 *                       type: string
 *                     inProgressCount:
 *                       type: integer
 *                     pendingCount:
 *                       type: integer
 *                 recentLogs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       activity:
 *                         type: string
 *                       dateTime:
 *                         type: string
 *                         format: date-time
 *                 teamPercentCompleteLogs:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                 currentUserPendingTaskCount:
 *                   type: integer
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch user logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-user-logs/:userId', getUserLogsDashboard);

/**
 * @swagger
 * /logs/create-log:
 *   post:
 *     summary: Create a new log
 *     description: Create a new task log entry
 *     tags: [Logs]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activity, userId, status]
 *             properties:
 *               activity:
 *                 type: string
 *                 example: "Complete customer onboarding"
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439016"
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, On Hold, In Progress]
 *                 example: "Pending"
 *     responses:
 *       201:
 *         description: Log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 log:
 *                   $ref: '#/components/schemas/Logs'
 *       500:
 *         description: Failed to create log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-log', createLog);

/**
 * @swagger
 * /logs/update-log/{logId}:
 *   put:
 *     summary: Update a log
 *     description: Update an existing log entry
 *     tags: [Logs]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Log ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activity:
 *                 type: string
 *               userId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, On Hold, In Progress]
 *               assignedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Log updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 log:
 *                   $ref: '#/components/schemas/Logs'
 *       404:
 *         description: Log not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to update log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/update-log/:logId', updateLog);

/**
 * @swagger
 * /logs/update-log-status/{logId}:
 *   patch:
 *     summary: Update log status
 *     description: Update only the status of an existing log entry
 *     tags: [Logs]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Log ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, On Hold, In Progress]
 *                 example: "Completed"
 *     responses:
 *       200:
 *         description: Log status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 log:
 *                   $ref: '#/components/schemas/Logs'
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Log not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to update status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/update-log-status/:logId', updateLogStatus);

/**
 * @swagger
 * /logs/delete-log/{logId}:
 *   delete:
 *     summary: Delete a log
 *     description: Delete a log entry by ID
 *     tags: [Logs]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Log ID to delete
 *     responses:
 *       200:
 *         description: Log deleted successfully
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
 *                   example: "Log deleted successfully"
 *       404:
 *         description: Log not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to delete log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/delete-log/:logId', deleteLog);

export default router;
