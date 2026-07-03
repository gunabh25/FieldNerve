import { Router } from "express";
import vendorRoutes from "./vendorRoutes.js";

const router = Router();

router.use("/vendors", vendorRoutes);

export default router;
