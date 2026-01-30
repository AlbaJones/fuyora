import { Router } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { ensureAdmin } from "../middleware/admin";
import { ViolationStatus, ViolationSeverity } from "../models/language-violation";

const router = Router();

/**
 * GET /admin/language-violations
 * List all language violations (admin)
 */
router.get("/admin/language-violations", ensureAuthenticated, ensureAdmin, async (req: any, res) => {
  try {
    const moderationService = req.scope.resolve("moderationService");
    const { status, severity, user_id, page = 1, per_page = 20 } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (user_id) filters.userId = user_id;

    const result = await moderationService.listViolations(
      filters,
      parseInt(page as string),
      parseInt(per_page as string)
    );

    res.json(result);
  } catch (error) {
    console.error("Error listing violations:", error);
    res.status(500).json({ error: "Failed to list violations" });
  }
});

/**
 * GET /admin/language-violations/:id
 * Get violation details (admin)
 */
router.get("/admin/language-violations/:id", ensureAuthenticated, ensureAdmin, async (req: any, res) => {
  try {
    const { languageViolationRepository } = req.scope.resolve("languageViolationRepository");
    const { id } = req.params;

    const violation = await languageViolationRepository.findOne({
      where: { id },
      relations: ["user"]
    });

    if (!violation) {
      return res.status(404).json({ error: "Violation not found" });
    }

    res.json({ violation });
  } catch (error) {
    console.error("Error fetching violation:", error);
    res.status(500).json({ error: "Failed to fetch violation" });
  }
});

/**
 * POST /admin/language-violations/:id/dismiss
 * Dismiss a violation (false positive)
 */
router.post("/admin/language-violations/:id/dismiss", ensureAuthenticated, ensureAdmin, async (req: any, res) => {
  try {
    const moderationService = req.scope.resolve("moderationService");
    const adminId = req.user.id || req.user.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const violation = await moderationService.dismissViolation(id, adminId, reason);

    res.json({
      message: "Violation dismissed",
      violation
    });
  } catch (error: any) {
    console.error("Error dismissing violation:", error);
    res.status(400).json({ error: error.message || "Failed to dismiss violation" });
  }
});

/**
 * POST /admin/language-violations/:id/confirm
 * Confirm a violation and apply penalty
 */
router.post("/admin/language-violations/:id/confirm", ensureAuthenticated, ensureAdmin, async (req: any, res) => {
  try {
    const moderationService = req.scope.resolve("moderationService");
    const adminId = req.user.id || req.user.userId;
    const { id } = req.params;
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ error: "Action is required" });
    }

    const violation = await moderationService.applyPenalty(id, action, adminId);

    res.json({
      message: "Violation confirmed and penalty applied",
      violation
    });
  } catch (error: any) {
    console.error("Error confirming violation:", error);
    res.status(400).json({ error: error.message || "Failed to confirm violation" });
  }
});

/**
 * DELETE /admin/language-violations/:id/remove-ban
 * Remove temporary ban early (admin override)
 */
router.delete("/admin/language-violations/:id/remove-ban", ensureAuthenticated, ensureAdmin, async (req: any, res) => {
  try {
    const { languageViolationRepository } = req.scope.resolve("languageViolationRepository");
    const banService = req.scope.resolve("banService");
    const { id } = req.params;

    const violation = await languageViolationRepository.findOne({
      where: { id }
    });

    if (!violation) {
      return res.status(404).json({ error: "Violation not found" });
    }

    if (violation.ban_id) {
      await banService.unban(violation.ban_id);
    }

    res.json({
      message: "Temporary ban removed",
      violation
    });
  } catch (error: any) {
    console.error("Error removing ban:", error);
    res.status(400).json({ error: error.message || "Failed to remove ban" });
  }
});

export default router;
