import { 
    getTeams, 
    getTeamById, 
    updateTeam, 
    deleteTeam, 
    createTeam 
} from "../controllers/team";

import express from "express";

const router = express.Router();

router.get("/get-all-teams", getTeams);
router.get("/get-team/:id", getTeamById);
router.post("/create-team", createTeam);
router.put("/update-team/:id", updateTeam);
router.delete("/delete-team/:id", deleteTeam);

export default router;