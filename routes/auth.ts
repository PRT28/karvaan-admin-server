import { 
    sendOtp,
    verifyOtp,
    createNewRole,
    createOrUpdateUser,
    deleteUser,
    getAllUsers,
    getUserById
} from "../controllers/auth";
import { checkKarvaanToken } from "../utils/middleware";
const express = require("express");
const router = express.Router(); 
 
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/create-or-update-user", checkKarvaanToken, createOrUpdateUser);
router.post("/create-new-role", checkKarvaanToken, createNewRole);
router.delete("/delete-user/:id", checkKarvaanToken, deleteUser);
router.get("/get-all-users", checkKarvaanToken, getAllUsers);
router.get("/get-user/:id", checkKarvaanToken, getUserById);

export default router;
