import { Router } from "express";
import { ensureAuthenticated } from "../middleware/auth";

const router = Router();

/**
 * GET /user/language-violations
 * Get user's own language violations
 */
router.get("/user/language-violations", ensureAuthenticated, async (req: any, res) => {
  try {
    const moderationService = req.scope.resolve("moderationService");
    const userId = req.user.id || req.user.userId;

    const violations = await moderationService.getViolationHistory(userId);

    res.json({
      violations: violations.map(v => ({
        id: v.id,
        content: v.content.substring(0, 100) + "...", // Truncate for privacy
        detected_words: v.detected_words,
        severity: v.severity,
        status: v.status,
        action_taken: v.action_taken,
        appeal_submitted: v.appeal_submitted,
        created_at: v.created_at,
        reviewed_at: v.reviewed_at
      }))
    });
  } catch (error) {
    console.error("Error fetching violations:", error);
    res.status(500).json({ error: "Failed to fetch violations" });
  }
});

/**
 * POST /language-violations/:id/appeal
 * Submit appeal for a violation
 */
router.post("/language-violations/:id/appeal", ensureAuthenticated, async (req: any, res) => {
  try {
    const moderationService = req.scope.resolve("moderationService");
    const userId = req.user.id || req.user.userId;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.length < 10) {
      return res.status(400).json({
        error: "Appeal message must be at least 10 characters"
      });
    }

    const violation = await moderationService.submitAppeal(id, userId, message);

    res.json({
      message: "Appeal submitted successfully",
      violation: {
        id: violation.id,
        appeal_submitted: violation.appeal_submitted,
        appeal_message: violation.appeal_message
      }
    });
  } catch (error: any) {
    console.error("Error submitting appeal:", error);
    res.status(400).json({ error: error.message || "Failed to submit appeal" });
  }
});

export default router;
