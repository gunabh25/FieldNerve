import { Router } from "express";
import * as workRequirementController from "../controllers/workRequirementController.js";

const router = Router();

router.get("/", workRequirementController.getWorkRequirements);
router.get("/:id", workRequirementController.getWorkRequirement);
router.post("/", workRequirementController.createWorkRequirement);
router.put("/:id", workRequirementController.updateWorkRequirement);
router.delete("/:id", workRequirementController.deleteWorkRequirement);

export default router;
