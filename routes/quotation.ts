import {
    getAllQuotations,
    getQuotationsByParty,
    createQuotation,
    updateQuotation,
    deleteQuotation
} from '../controllers/quotation'

import express from 'express';

const router = express.Router();

router.get('/get-all-quotations', getAllQuotations);
router.get('/get-quotations-by-party:id', getQuotationsByParty);
router.post('/create-quotation', createQuotation);
router.put('/update-quotation/:id', updateQuotation);
router.delete('/delete-quotation/:id', deleteQuotation);

export default router;
