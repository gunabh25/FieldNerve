import prisma from "../lib/prisma.js";

const documentSelect = {
  id: true,
  vendorId: true,
  documentType: true,
  expiryDate: true,
  isVerified: true,
  createdAt: true,
};

export async function vendorExists(vendorId) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true },
  });
  return Boolean(vendor);
}

export async function getDocumentsByVendorId(vendorId, filters = {}) {
  const { documentType, isVerified } = filters;
  const where = { vendorId };

  if (documentType) where.documentType = documentType;
  if (isVerified !== undefined) where.isVerified = isVerified === "true" || isVerified === true;

  return prisma.vendorDocument.findMany({
    where,
    select: documentSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentById(vendorId, documentId) {
  return prisma.vendorDocument.findFirst({
    where: { id: documentId, vendorId },
    select: documentSelect,
  });
}

export async function createDocument(vendorId, data) {
  return prisma.vendorDocument.create({
    data: { ...data, vendorId },
    select: documentSelect,
  });
}

export async function updateDocument(vendorId, documentId, data) {
  const existing = await getDocumentById(vendorId, documentId);
  if (!existing) {
    const error = new Error("Document not found");
    error.code = "P2025";
    throw error;
  }

  return prisma.vendorDocument.update({
    where: { id: documentId },
    data,
    select: documentSelect,
  });
}

export async function deleteDocument(vendorId, documentId) {
  const existing = await getDocumentById(vendorId, documentId);
  if (!existing) {
    const error = new Error("Document not found");
    error.code = "P2025";
    throw error;
  }

  return prisma.vendorDocument.delete({
    where: { id: documentId },
    select: documentSelect,
  });
}
