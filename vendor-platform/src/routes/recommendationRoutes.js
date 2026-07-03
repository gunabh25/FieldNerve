import { Router } from "express";
import * as recommendationController from "../controllers/recommendationController.js";

const router = Router();

router.post("/:workRequirementId/summary", recommendationController.getRecommendationSummary);
router.post("/:workRequirementId", recommendationController.getRecommendations);

export default router;
