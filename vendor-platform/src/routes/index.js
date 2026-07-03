import { Router } from "express";
import vendorRoutes from "./vendorRoutes.js";
import workRequirementRoutes from "./workRequirementRoutes.js";

const router = Router();

router.use("/vendors", vendorRoutes);
router.use("/work-requirements", workRequirementRoutes);

export default router;
