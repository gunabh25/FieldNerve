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
};

function normalize(value) {
  return value.trim().toLowerCase();
}

function scoreVendor(vendor, workRequirement) {
  let score = 0;
  const reasons = [];

  if (normalize(vendor.category) === normalize(workRequirement.category)) {
    score += 40;
    reasons.push("Category match (+40)");
  }

  if (normalize(vendor.operatingLocation) === normalize(workRequirement.location)) {
    score += 30;
    reasons.push("Location match (+30)");
  }

  const ratingPoints = vendor.rating * 6;
  score += ratingPoints;
  reasons.push(`Rating ${vendor.rating} x 6 (+${ratingPoints})`);

  if (vendor.status === "ACTIVE") {
    score += 10;
    reasons.push("Active vendor (+10)");
  }

  return { score, reasons };
}

export async function getRecommendations(workRequirementId) {
  const workRequirement = await prisma.workRequirement.findUnique({
    where: { id: workRequirementId },
  });

  if (!workRequirement) {
    return null;
  }

  const vendors = await prisma.vendor.findMany({
    where: { status: "ACTIVE" },
    select: vendorSelect,
  });

  const recommendations = vendors
    .map((vendor) => {
      const { score, reasons } = scoreVendor(vendor, workRequirement);
      return { vendor, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return { workRequirement, recommendations };
}
