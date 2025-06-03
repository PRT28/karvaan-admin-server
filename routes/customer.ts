import { 
    getCustomers, 
    getCustomerById, 
    updateCustomer, 
    deleteCustomer, 
    createCustomer 
} from "../controllers/customer";

import express from "express";

const router = express.Router();

router.get("/get-all-customers", getCustomers);
router.get("/get-customer/:id", getCustomerById);
router.post("/create-customer", createCustomer);
router.put("/update-customer/:id", updateCustomer);
router.delete("/delete-customer/:id", deleteCustomer);

export default router;