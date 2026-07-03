import { Router } from "express";
import * as vendorController from "../controllers/vendorController.js";
import vendorDocumentRoutes from "./vendorDocumentRoutes.js";

const router = Router();

router.get("/", vendorController.getVendors);
router.use("/:vendorId/documents", vendorDocumentRoutes);
router.get("/:id", vendorController.getVendor);
router.post("/", vendorController.createVendor);
router.put("/:id", vendorController.updateVendor);
router.delete("/:id", vendorController.deleteVendor);

export default router;
