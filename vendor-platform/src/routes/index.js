import { Router } from "express";
import vendorRoutes from "./vendorRoutes.js";
import workRequirementRoutes from "./workRequirementRoutes.js";
import recommendationRoutes from "./recommendationRoutes.js";

const router = Router();

router.use("/vendors", vendorRoutes);
router.use("/work-requirements", workRequirementRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/recommendation", recommendationRoutes);

export default router;
