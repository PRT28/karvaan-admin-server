import { 
    getVendors, 
    getVendorById, 
    updateVendor, 
    deleteVendor, 
    createVendor 
} from "../controllers/vendor";

import express from "express";

const router = express.Router();

router.get("/get-all-vendors", getVendors);
router.get("/get-vendor/:id", getVendorById);
router.post("/create-vendor", createVendor);
router.put("/update-vendor/:id", updateVendor);
router.delete("/delete-vendor/:id", deleteVendor);

export default router;