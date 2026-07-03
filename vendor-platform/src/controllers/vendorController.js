import * as vendorService from "../services/vendorService.js";

const REQUIRED_FIELDS = [
  "name",
  "vendorType",
  "category",
  "contactName",
  "email",
  "operatingLocation",
];

const VENDOR_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

function validateCreateBody(body) {
  const missing = REQUIRED_FIELDS.filter((field) => !body[field]?.toString().trim());

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (body.status && !VENDOR_STATUSES.includes(body.status)) {
    const error = new Error(`Invalid status. Must be one of: ${VENDOR_STATUSES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (body.rating !== undefined) {
    const rating = Number(body.rating);
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      const error = new Error("Rating must be a number between 0 and 5");
      error.statusCode = 400;
      throw error;
    }
  }
}

function pickVendorFields(body) {
  const data = {};

  for (const field of [...REQUIRED_FIELDS, "phone", "status", "rating"]) {
    if (body[field] !== undefined) {
      data[field] = field === "rating" ? Number(body.rating) : body[field];
    }
  }

  return data;
}

export async function getVendors(req, res, next) {
  try {
    const vendors = await vendorService.getAllVendors({
      status: req.query.status,
      category: req.query.category,
      vendorType: req.query.vendorType,
    });
    res.json({ data: vendors });
  } catch (error) {
    next(error);
  }
}

export async function getVendor(req, res, next) {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({ data: vendor });
  } catch (error) {
    next(error);
  }
}

export async function createVendor(req, res, next) {
  try {
    validateCreateBody(req.body);
    const vendor = await vendorService.createVendor(pickVendorFields(req.body));
    res.status(201).json({ data: vendor });
  } catch (error) {
    next(error);
  }
}

export async function updateVendor(req, res, next) {
  try {
    if (req.body.status && !VENDOR_STATUSES.includes(req.body.status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VENDOR_STATUSES.join(", ")}`,
      });
    }

    if (req.body.rating !== undefined) {
      const rating = Number(req.body.rating);
      if (Number.isNaN(rating) || rating < 0 || rating > 5) {
        return res.status(400).json({ error: "Rating must be a number between 0 and 5" });
      }
    }

    const vendor = await vendorService.updateVendor(req.params.id, pickVendorFields(req.body));
    res.json({ data: vendor });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Vendor not found" });
    }
    next(error);
  }
}

export async function deleteVendor(req, res, next) {
  try {
    const vendor = await vendorService.deleteVendor(req.params.id);
    res.json({ data: vendor });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Vendor not found" });
    }
    next(error);
  }
}
