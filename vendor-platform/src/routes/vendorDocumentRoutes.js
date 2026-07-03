import { Router } from "express";
import * as vendorDocumentController from "../controllers/vendorDocumentController.js";

const router = Router({ mergeParams: true });

router.get("/", vendorDocumentController.getDocuments);
router.get("/:documentId", vendorDocumentController.getDocument);
router.post("/", vendorDocumentController.createDocument);
router.put("/:documentId", vendorDocumentController.updateDocument);
router.delete("/:documentId", vendorDocumentController.deleteDocument);

export default router;
