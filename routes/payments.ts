import express from 'express';
import {
  listCustomerClosingBalances,
  listVendorClosingBalances,
  getCustomerLedger,
  getVendorLedger,
  getCustomerUnsettledQuotations,
  getVendorUnsettledQuotations,
  createCustomerPayment,
  createVendorPayment,
  createPaymentForQuotation,
  getQuotationLedger,
  updatePayment,
  deletePayment,
} from '../controllers/payments';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payments, ledgers, and balances
 */

router.get('/customers/closing-balance', listCustomerClosingBalances);
router.get('/vendors/closing-balance', listVendorClosingBalances);

router.get('/customers/:id/ledger', getCustomerLedger);
router.get('/vendors/:id/ledger', getVendorLedger);

router.get('/customers/:id/unsettled-quotations', getCustomerUnsettledQuotations);
router.get('/vendors/:id/unsettled-quotations', getVendorUnsettledQuotations);

router.post('/customers/:id/payments', createCustomerPayment);
router.post('/vendors/:id/payments', createVendorPayment);

router.post('/quotations/:id/payments', createPaymentForQuotation);
router.get('/quotations/:id/ledger', getQuotationLedger);

router.patch('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

export default router;
