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

router.get('/get-all-logs', getAllLogs);
router.get('/monthly-summary/:userId', getUserLogsByMonth);
router.get('/get-user-logs/:userId', getUserLogsDashboard);
router.post('/create-log', createLog);
router.put('/update-log/:logId', updateLog);
router.patch('/update-log-status/:logId', updateLogStatus);
router.delete('/delete-log/:logId', deleteLog);

export default router;
