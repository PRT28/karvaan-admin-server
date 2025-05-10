const { sendOtp, verifyOtp, createNewCompanyUser, getListOfUnverifiedCompany, markCompanyAsVerified } = require("../controllers/auth");

const express = require("express");
const router = express.Router(); 
 
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/create-new-company-user", createNewCompanyUser);
router.get("/get-list-of-unverified-company", getListOfUnverifiedCompany);
router.put("/mark-company-as-verified/:id", markCompanyAsVerified);

module.exports = router;
