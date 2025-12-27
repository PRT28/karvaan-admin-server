import express from 'express';
import {
  createMakerCheckerGroup,
  getMakerCheckerGroups,
  getMakerCheckerGroupById,
  updateMakerCheckerGroup,
  deleteMakerCheckerGroup,
  updateMakersList,
  updateCheckersList,
} from '../controllers/makerCheckerGroup';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MakerCheckerGroups
 *   description: Maker-checker group management endpoints
 */

/**
 * @swagger
 * /maker-checker-group/get-all-groups:
 *   get:
 *     summary: Get all maker-checker groups
 *     tags: [MakerCheckerGroups]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: query
 *         name: businessId
 *         schema:
 *           type: string
 *         description: Business ID filter (super admin only)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [booking, finance]
 *     responses:
 *       200:
 *         description: Maker-checker groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MakerCheckerGroup'
 */
router.get('/get-all-groups', getMakerCheckerGroups);

/**
 * @swagger
 * /maker-checker-group/get-group/{id}:
 *   get:
 *     summary: Get maker-checker group by ID
 *     tags: [MakerCheckerGroups]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maker-checker group retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   $ref: '#/components/schemas/MakerCheckerGroup'
 *       404:
 *         description: Maker-checker group not found
 */
router.get('/get-group/:id', getMakerCheckerGroupById);

/**
 * @swagger
 * /maker-checker-group/create-group:
 *   post:
 *     summary: Create a maker-checker group
 *     tags: [MakerCheckerGroups]
 *     security:
 *       - karvaanToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, makers, checkers]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [booking, finance]
 *               businessId:
 *                 type: string
 *                 description: Required for super admin
 *               makers:
 *                 type: array
 *                 items:
 *                   type: string
 *               checkers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Maker-checker group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   $ref: '#/components/schemas/MakerCheckerGroup'
 */
router.post('/create-group', createMakerCheckerGroup);

/**
 * @swagger
 * /maker-checker-group/update-group/{id}:
 *   put:
 *     summary: Update a maker-checker group
 *     tags: [MakerCheckerGroups]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [booking, finance]
 *               makers:
 *                 type: array
 *                 items:
 *                   type: string
 *               checkers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Maker-checker group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   $ref: '#/components/schemas/MakerCheckerGroup'
 */
router.put('/update-group/:id', updateMakerCheckerGroup);

/**
 * @swagger
 * /maker-checker-group/delete-group/{id}:
 *   delete:
 *     summary: Delete a maker-checker group
 *     tags: [MakerCheckerGroups]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maker-checker group deleted successfully
 */
router.delete('/delete-group/:id', deleteMakerCheckerGroup);

/**
 * @swagger
 * /maker-checker-group/update-makers/{id}:
 *   put:
 *     summary: Update makers list
 *     tags: [MakerCheckerGroups]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [makers]
 *             properties:
 *               makers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Makers list updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   $ref: '#/components/schemas/MakerCheckerGroup'
 */
router.put('/update-makers/:id', updateMakersList);

/**
 * @swagger
 * /maker-checker-group/update-checkers/{id}:
 *   put:
 *     summary: Update checkers list
 *     tags: [MakerCheckerGroups]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [checkers]
 *             properties:
 *               checkers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Checkers list updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   $ref: '#/components/schemas/MakerCheckerGroup'
 */
router.put('/update-checkers/:id', updateCheckersList);

export default router;
