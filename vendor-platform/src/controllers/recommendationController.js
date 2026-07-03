import * as recommendationService from "../services/recommendationService.js";

export async function getRecommendations(req, res, next) {
  try {
    const result = await recommendationService.getRecommendations(req.params.workRequirementId);

    if (!result) {
      return res.status(404).json({ error: "Work requirement not found" });
    }

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getRecommendationSummary(req, res, next) {
  try {
    const result = await recommendationService.getRecommendationSummary(req.params.workRequirementId);

    if (!result) {
      return res.status(404).json({ error: "Work requirement not found" });
    }

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}
