import express from 'express';
import {
  listCustomerClosingBalances,
  listVendorClosingBalances,
  getCustomerLedger,
  getVendorLedger,
  getCustomerUnsettledQuotations,
  getVendorUnsettledQuotations,
  getCustomerUnallocatedPayments,
  getVendorUnallocatedPayments,
  allocateCustomerPaymentToQuotation,
  allocateVendorPaymentToQuotation,
  allocateCustomerPaymentsToQuotation,
  allocateVendorPaymentsToQuotation,
  createCustomerPayment,
  createVendorPayment,
  createPaymentForQuotation,
  getQuotationLedger,
  updatePayment,
  deletePayment,
  listPayments,
} from '../controllers/payments';
import { handleDocumentUploadError } from '../middleware/documentUpload';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payments, ledgers, and balances
 */

router.get('/customers/closing-balance', listCustomerClosingBalances);
router.get('/vendors/closing-balance', listVendorClosingBalances);
router.get('/', listPayments);

router.get('/customers/:id/ledger', getCustomerLedger);
router.get('/vendors/:id/ledger', getVendorLedger);

router.get('/customers/:id/unsettled-quotations', getCustomerUnsettledQuotations);
router.get('/vendors/:id/unsettled-quotations', getVendorUnsettledQuotations);

/**
 * @swagger
 * /payments/customers/{id}/unallocated-payments:
 *   get:
 *     summary: Get unallocated customer payments
 *     description: List payments with unallocated amounts for the specified customer.
 *     tags: [Payments]
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
 *         description: Unallocated customer payments retrieved
 *       400:
 *         description: Invalid customer ID
 *       500:
 *         description: Failed to fetch unallocated customer payments
 */
router.get('/customers/:id/unallocated-payments', getCustomerUnallocatedPayments);

/**
 * @swagger
 * /payments/vendors/{id}/unallocated-payments:
 *   get:
 *     summary: Get unallocated vendor payments
 *     description: List payments with unallocated amounts for the specified vendor.
 *     tags: [Payments]
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
 *         description: Unallocated vendor payments retrieved
 *       400:
 *         description: Invalid vendor ID
 *       500:
 *         description: Failed to fetch unallocated vendor payments
 */
router.get('/vendors/:id/unallocated-payments', getVendorUnallocatedPayments);

/**
 * @swagger
 * /payments/customers/payments/{paymentId}/allocate:
 *   post:
 *     summary: Allocate customer payment to quotation
 *     description: Allocate an unallocated amount from a customer payment to a quotation.
 *     tags: [Payments]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quotationId, amount]
 *             properties:
 *               quotationId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Allocation applied successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Failed to allocate payment
 */
router.post('/customers/payments/:paymentId/allocate', allocateCustomerPaymentToQuotation);

/**
 * @swagger
 * /payments/vendors/payments/{paymentId}/allocate:
 *   post:
 *     summary: Allocate vendor payment to quotation
 *     description: Allocate an unallocated amount from a vendor payment to a quotation.
 *     tags: [Payments]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quotationId, amount]
 *             properties:
 *               quotationId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Allocation applied successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Failed to allocate payment
 */
router.post('/vendors/payments/:paymentId/allocate', allocateVendorPaymentToQuotation);

/**
 * @swagger
 * /payments/customers/quotations/{quotationId}/allocate-payments:
 *   post:
 *     summary: Allocate multiple customer payments to a quotation
 *     description: Allocate amounts from multiple customer payments to a single quotation.
 *     tags: [Payments]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [allocations]
 *             properties:
 *               allocations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [paymentId, amount]
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     amount:
 *                       type: number
 *     responses:
 *       200:
 *         description: Allocations applied successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment or quotation not found
 *       500:
 *         description: Failed to allocate payments
 */
router.post('/customers/quotations/:quotationId/allocate-payments', allocateCustomerPaymentsToQuotation);

/**
 * @swagger
 * /payments/vendors/quotations/{quotationId}/allocate-payments:
 *   post:
 *     summary: Allocate multiple vendor payments to a quotation
 *     description: Allocate amounts from multiple vendor payments to a single quotation.
 *     tags: [Payments]
 *     security:
 *       - karvaanToken: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [allocations]
 *             properties:
 *               allocations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [paymentId, amount]
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     amount:
 *                       type: number
 *     responses:
 *       200:
 *         description: Allocations applied successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment or quotation not found
 *       500:
 *         description: Failed to allocate payments
 */
router.post('/vendors/quotations/:quotationId/allocate-payments', allocateVendorPaymentsToQuotation);

router.post('/customers/:id/payments', handleDocumentUploadError, createCustomerPayment);
router.post('/vendors/:id/payments', handleDocumentUploadError, createVendorPayment);

router.post('/quotations/:id/payments', handleDocumentUploadError, createPaymentForQuotation);
router.get('/quotations/:id/ledger', getQuotationLedger);

router.patch('/payments/:id', handleDocumentUploadError, updatePayment);
router.delete('/payments/:id', deletePayment);

export default router;
