import prisma from "../lib/prisma.js";

const workRequirementSelect = {
  id: true,
  title: true,
  category: true,
  location: true,
  estimatedValue: true,
  priority: true,
  expectedStartDate: true,
  createdAt: true,
};

export async function getAllWorkRequirements(filters = {}) {
  const { category, priority, location } = filters;
  const where = {};

  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (location) where.location = location;

  return prisma.workRequirement.findMany({
    where,
    select: workRequirementSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkRequirementById(id) {
  return prisma.workRequirement.findUnique({
    where: { id },
    select: workRequirementSelect,
  });
}

export async function createWorkRequirement(data) {
  return prisma.workRequirement.create({
    data,
    select: workRequirementSelect,
  });
}

export async function updateWorkRequirement(id, data) {
  return prisma.workRequirement.update({
    where: { id },
    data,
    select: workRequirementSelect,
  });
}

export async function deleteWorkRequirement(id) {
  return prisma.workRequirement.delete({
    where: { id },
    select: workRequirementSelect,
  });
}
