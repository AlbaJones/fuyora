import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { ensureAdmin } from "../middleware/admin";
import { adminLimiter } from "../middleware/rate-limit";

const router = Router();

// Get submissions by approval level
router.get(
  "/admin/kyc/level/:level/submissions",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { level } = req.params;
      const levelNum = parseInt(level);

      if (isNaN(levelNum) || levelNum < 1 || levelNum > 3) {
        return res.status(400).json({
          message: "Level must be 1, 2, or 3",
        });
      }

      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "20");

      const kycService = req.scope.resolve("kycService");
      const result = await kycService.getSubmissionsByLevel(levelNum, page, limit);

      return res.json(result);
    } catch (error: any) {
      console.error("Get submissions by level error:", error);
      return res.status(500).json({
        message: "Failed to get submissions by level",
      });
    }
  }
);

// Approve at current level
router.post(
  "/admin/kyc/submissions/:id/approve-level",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { final_approval } = req.body;
      const reviewerId = req.user!.userId || (req.user as any).id;

      const kycService = req.scope.resolve("kycService");
      const submission = await kycService.approveLevel(
        id,
        reviewerId,
        final_approval === true
      );

      return res.json({
        id: submission.id,
        status: submission.status,
        approval_level: submission.approval_level,
        message: final_approval
          ? "KYC submission fully approved"
          : "KYC submission approved at current level",
      });
    } catch (error: any) {
      console.error("Approve level error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message.includes("already")) {
        return res.status(409).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to approve at level",
      });
    }
  }
);

// Escalate to next level
router.post(
  "/admin/kyc/submissions/:id/escalate",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const reviewerId = req.user!.userId || (req.user as any).id;

      if (!reason || typeof reason !== "string") {
        return res.status(400).json({
          message: "Escalation reason is required",
        });
      }

      const kycService = req.scope.resolve("kycService");
      const submission = await kycService.escalateToNextLevel(
        id,
        reviewerId,
        reason
      );

      return res.json({
        id: submission.id,
        approval_level: submission.approval_level,
        message: `KYC submission escalated to level ${submission.approval_level}`,
      });
    } catch (error: any) {
      console.error("Escalate error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message.includes("already")) {
        return res.status(409).json({
          message: error.message,
        });
      }

      if (error.message.includes("maximum")) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to escalate submission",
      });
    }
  }
);

// Reject at current level
router.post(
  "/admin/kyc/submissions/:id/reject-level",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const reviewerId = req.user!.userId || (req.user as any).id;

      if (!rejection_reason || typeof rejection_reason !== "string") {
        return res.status(400).json({
          message: "Rejection reason is required",
        });
      }

      const kycService = req.scope.resolve("kycService");
      const submission = await kycService.rejectLevel(
        id,
        reviewerId,
        rejection_reason
      );

      return res.json({
        id: submission.id,
        status: submission.status,
        rejection_reason: submission.rejection_reason,
        message: "KYC submission rejected",
      });
    } catch (error: any) {
      console.error("Reject level error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message.includes("already")) {
        return res.status(409).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to reject submission",
      });
    }
  }
);

export default router;
