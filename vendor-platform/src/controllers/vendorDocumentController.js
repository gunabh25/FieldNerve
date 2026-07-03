import * as vendorDocumentService from "../services/vendorDocumentService.js";

const REQUIRED_FIELDS = ["documentType"];

function pickDocumentFields(body) {
  const data = {};

  if (body.documentType !== undefined) data.documentType = body.documentType;
  if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
  if (body.isVerified !== undefined) data.isVerified = Boolean(body.isVerified);

  return data;
}

function validateCreateBody(body) {
  const missing = REQUIRED_FIELDS.filter((field) => !body[field]?.toString().trim());

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (body.expiryDate && Number.isNaN(new Date(body.expiryDate).getTime())) {
    const error = new Error("expiryDate must be a valid date");
    error.statusCode = 400;
    throw error;
  }
}

function validateUpdateBody(body) {
  if (body.expiryDate !== undefined && body.expiryDate !== null) {
    if (Number.isNaN(new Date(body.expiryDate).getTime())) {
      const error = new Error("expiryDate must be a valid date");
      error.statusCode = 400;
      throw error;
    }
  }
}

async function ensureVendorExists(vendorId, res) {
  const exists = await vendorDocumentService.vendorExists(vendorId);
  if (!exists) {
    res.status(404).json({ error: "Vendor not found" });
    return false;
  }
  return true;
}

export async function getDocuments(req, res, next) {
  try {
    const { vendorId } = req.params;

    if (!(await ensureVendorExists(vendorId, res))) return;

    const documents = await vendorDocumentService.getDocumentsByVendorId(vendorId, {
      documentType: req.query.documentType,
      isVerified: req.query.isVerified,
    });
    res.json({ data: documents });
  } catch (error) {
    next(error);
  }
}

export async function getDocument(req, res, next) {
  try {
    const { vendorId, documentId } = req.params;

    if (!(await ensureVendorExists(vendorId, res))) return;

    const document = await vendorDocumentService.getDocumentById(vendorId, documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ data: document });
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req, res, next) {
  try {
    const { vendorId } = req.params;

    if (!(await ensureVendorExists(vendorId, res))) return;

    validateCreateBody(req.body);
    const document = await vendorDocumentService.createDocument(
      vendorId,
      pickDocumentFields(req.body),
    );
    res.status(201).json({ data: document });
  } catch (error) {
    next(error);
  }
}

export async function updateDocument(req, res, next) {
  try {
    const { vendorId, documentId } = req.params;

    if (!(await ensureVendorExists(vendorId, res))) return;

    validateUpdateBody(req.body);
    const document = await vendorDocumentService.updateDocument(
      vendorId,
      documentId,
      pickDocumentFields(req.body),
    );
    res.json({ data: document });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Document not found" });
    }
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const { vendorId, documentId } = req.params;

    if (!(await ensureVendorExists(vendorId, res))) return;

    const document = await vendorDocumentService.deleteDocument(vendorId, documentId);
    res.json({ data: document });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Document not found" });
    }
    next(error);
  }
}
