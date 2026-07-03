import { Router } from "express";
import * as vendorController from "../controllers/vendorController.js";

const router = Router();

router.get("/", vendorController.getVendors);
router.get("/:id", vendorController.getVendor);
router.post("/", vendorController.createVendor);
router.put("/:id", vendorController.updateVendor);
router.delete("/:id", vendorController.deleteVendor);

export default router;
