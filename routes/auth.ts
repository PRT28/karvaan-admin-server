import { 
    sendOtpAgent,
    sendOtpSU,
    verifyOtp,
    createNewRole,
    createOrUpdateUser,
    deleteUser,
    getAllUsers,
    getUserById,
    insertTest
} from "../controllers/auth";
import express from "express";

import { checkKarvaanToken } from "../utils/middleware";

const router = express.Router();

router.post("/send-otp/agent", sendOtpAgent);
router.post("/send-otp/super-admin", sendOtpSU);
router.post("/verify-otp", verifyOtp);
router.post("/insert", insertTest);
router.post("/create-or-update-user", checkKarvaanToken, createOrUpdateUser);
router.post("/create-new-role", createNewRole);
router.delete("/delete-user/:id", checkKarvaanToken, deleteUser);
router.get("/get-all-users", checkKarvaanToken, getAllUsers);
router.get("/get-user/:id", checkKarvaanToken, getUserById);

export default router;
