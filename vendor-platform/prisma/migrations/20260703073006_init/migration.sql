-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Vendor" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "vendorType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "operatingLocation" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkRequirement" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "estimatedValue" DECIMAL(12,2) NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "expectedStartDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE INDEX "Vendor_category_idx" ON "Vendor"("category");

-- CreateIndex
CREATE INDEX "Vendor_vendorType_idx" ON "Vendor"("vendorType");

-- CreateIndex
CREATE INDEX "VendorDocument_vendorId_idx" ON "VendorDocument"("vendorId");

-- CreateIndex
CREATE INDEX "VendorDocument_documentType_idx" ON "VendorDocument"("documentType");

-- CreateIndex
CREATE INDEX "WorkRequirement_category_idx" ON "WorkRequirement"("category");

-- CreateIndex
CREATE INDEX "WorkRequirement_priority_idx" ON "WorkRequirement"("priority");

-- CreateIndex
CREATE INDEX "WorkRequirement_expectedStartDate_idx" ON "WorkRequirement"("expectedStartDate");

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
