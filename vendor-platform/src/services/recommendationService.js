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

export function scoreVendor(vendor, workRequirement) {
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

function buildVendorSummary(vendor, workRequirement, score, reasons, rank) {
  const categoryMatch = normalize(vendor.category) === normalize(workRequirement.category);
  const locationMatch = normalize(vendor.operatingLocation) === normalize(workRequirement.location);
  const ratingPoints = vendor.rating * 6;

  const sentences = [
    `${vendor.name} is ranked #${rank} with a score of ${score} for "${workRequirement.title}".`,
    categoryMatch
      ? `The vendor category "${vendor.category}" matches the required category "${workRequirement.category}" (+40).`
      : `The vendor category "${vendor.category}" does not match the required category "${workRequirement.category}" (0).`,
    locationMatch
      ? `The operating location "${vendor.operatingLocation}" matches the job location "${workRequirement.location}" (+30).`
      : `The operating location "${vendor.operatingLocation}" does not match the job location "${workRequirement.location}" (0).`,
    `A rating of ${vendor.rating} contributes ${ratingPoints} points (rating x 6).`,
    `The vendor status is ${vendor.status}, contributing ${vendor.status === "ACTIVE" ? 10 : 0} points.`,
    `Total breakdown: ${reasons.join(", ")}.`,
  ];

  return sentences.join(" ");
}

async function fetchScoredRecommendations(workRequirementId) {
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
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.vendor.name.localeCompare(b.vendor.name);
    })
    .slice(0, 3);

  return { workRequirement, recommendations };
}

export async function getRecommendations(workRequirementId) {
  return fetchScoredRecommendations(workRequirementId);
}

export async function getRecommendationSummary(workRequirementId) {
  const result = await fetchScoredRecommendations(workRequirementId);

  if (!result) {
    return null;
  }

  const summaries = result.recommendations.map((recommendation, index) => {
    const rank = index + 1;
    const { vendor, score, reasons } = recommendation;

    return {
      rank,
      vendorId: vendor.id,
      vendorName: vendor.name,
      score,
      reasons,
      summary: buildVendorSummary(vendor, result.workRequirement, score, reasons, rank),
    };
  });

  return {
    workRequirement: result.workRequirement,
    summaries,
  };
}
