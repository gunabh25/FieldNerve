import * as workRequirementService from "../services/workRequirementService.js";

const REQUIRED_FIELDS = ["title", "category", "location", "estimatedValue", "expectedStartDate"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

function pickWorkRequirementFields(body) {
  const data = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.category !== undefined) data.category = body.category;
  if (body.location !== undefined) data.location = body.location;
  if (body.estimatedValue !== undefined) data.estimatedValue = body.estimatedValue;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.expectedStartDate !== undefined) {
    data.expectedStartDate = new Date(body.expectedStartDate);
  }

  return data;
}

function validateEstimatedValue(value) {
  const amount = Number(value);
  if (Number.isNaN(amount) || amount < 0) {
    const error = new Error("estimatedValue must be a non-negative number");
    error.statusCode = 400;
    throw error;
  }
}

function validatePriority(priority) {
  if (priority && !PRIORITIES.includes(priority)) {
    const error = new Error(`Invalid priority. Must be one of: ${PRIORITIES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
}

function validateDate(field, value) {
  if (value && Number.isNaN(new Date(value).getTime())) {
    const error = new Error(`${field} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }
}

function validateCreateBody(body) {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value.toString().trim() === "";
  });

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  validateEstimatedValue(body.estimatedValue);
  validatePriority(body.priority);
  validateDate("expectedStartDate", body.expectedStartDate);
}

function validateUpdateBody(body) {
  if (body.estimatedValue !== undefined) validateEstimatedValue(body.estimatedValue);
  if (body.priority !== undefined) validatePriority(body.priority);
  if (body.expectedStartDate !== undefined) validateDate("expectedStartDate", body.expectedStartDate);
}

export async function getWorkRequirements(req, res, next) {
  try {
    const workRequirements = await workRequirementService.getAllWorkRequirements({
      category: req.query.category,
      priority: req.query.priority,
      location: req.query.location,
    });
    res.json({ data: workRequirements });
  } catch (error) {
    next(error);
  }
}

export async function getWorkRequirement(req, res, next) {
  try {
    const workRequirement = await workRequirementService.getWorkRequirementById(req.params.id);

    if (!workRequirement) {
      return res.status(404).json({ error: "Work requirement not found" });
    }

    res.json({ data: workRequirement });
  } catch (error) {
    next(error);
  }
}

export async function createWorkRequirement(req, res, next) {
  try {
    validateCreateBody(req.body);
    const workRequirement = await workRequirementService.createWorkRequirement(
      pickWorkRequirementFields(req.body),
    );
    res.status(201).json({ data: workRequirement });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkRequirement(req, res, next) {
  try {
    validateUpdateBody(req.body);
    const workRequirement = await workRequirementService.updateWorkRequirement(
      req.params.id,
      pickWorkRequirementFields(req.body),
    );
    res.json({ data: workRequirement });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Work requirement not found" });
    }
    next(error);
  }
}

export async function deleteWorkRequirement(req, res, next) {
  try {
    const workRequirement = await workRequirementService.deleteWorkRequirement(req.params.id);
    res.json({ data: workRequirement });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Work requirement not found" });
    }
    next(error);
  }
}
