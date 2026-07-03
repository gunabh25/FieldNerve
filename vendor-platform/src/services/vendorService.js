import prisma from "../lib/prisma.js";

const vendorSelect = {
  id: true,
  name: true,
  vendorType: true,
  category: true,
  contactName: true,
  email: true,
  phone: true,
  operatingLocation: true,
  rating: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export async function getAllVendors(filters = {}) {
  const { status, category, vendorType } = filters;
  const where = {};

  if (status) where.status = status;
  if (category) where.category = category;
  if (vendorType) where.vendorType = vendorType;

  return prisma.vendor.findMany({
    where,
    select: vendorSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getVendorById(id) {
  return prisma.vendor.findUnique({
    where: { id },
    include: { documents: true },
  });
}

export async function createVendor(data) {
  return prisma.vendor.create({
    data,
    select: vendorSelect,
  });
}

export async function updateVendor(id, data) {
  return prisma.vendor.update({
    where: { id },
    data,
    select: vendorSelect,
  });
}

export async function deleteVendor(id) {
  return prisma.vendor.delete({
    where: { id },
    select: vendorSelect,
  });
}
