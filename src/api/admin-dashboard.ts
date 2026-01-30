import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { ensureAdmin } from "../middleware/admin";
import { adminLimiter } from "../middleware/rate-limit";

const router = Router();

// Get overall dashboard statistics
router.get(
  "/admin/dashboard/stats",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const dashboardService = req.scope.resolve("dashboardService");
      const stats = await dashboardService.getOverallStats();

      return res.json(stats);
    } catch (error: any) {
      console.error("Dashboard stats error:", error);
      return res.status(500).json({
        message: "Failed to get dashboard statistics",
      });
    }
  }
);

// Get KYC-specific metrics
router.get(
  "/admin/dashboard/kyc-metrics",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const dashboardService = req.scope.resolve("dashboardService");
      const metrics = await dashboardService.getKycMetrics();

      return res.json(metrics);
    } catch (error: any) {
      console.error("KYC metrics error:", error);
      return res.status(500).json({
        message: "Failed to get KYC metrics",
      });
    }
  }
);

// Get recent activity
router.get(
  "/admin/dashboard/recent-activity",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || "10");

      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          message: "Limit must be between 1 and 100",
        });
      }

      const dashboardService = req.scope.resolve("dashboardService");
      const activity = await dashboardService.getRecentActivity(limit);

      return res.json({
        recent_activity: activity,
      });
    } catch (error: any) {
      console.error("Recent activity error:", error);
      return res.status(500).json({
        message: "Failed to get recent activity",
      });
    }
  }
);

// Get document URLs for viewing (NO AI/OCR - just returns URLs for manual review)
router.get(
  "/admin/kyc/submissions/:id/documents",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const kycService = req.scope.resolve("kycService");

      const submission = await kycService.getSubmissionById(id);

      if (!submission) {
        return res.status(404).json({
          message: "KYC submission not found",
        });
      }

      // Return document URLs for manual viewing by admin
      // NO automated verification, NO OCR, NO AI analysis
      return res.json({
        submission_id: id,
        user_id: submission.user_id,
        documents: {
          doc_url: submission.documents.doc_url,
          selfie_url: submission.documents.selfie_url,
          proof_url: submission.documents.proof_url,
        },
        personal_data: submission.personal_data,
        note: "Documents must be manually reviewed by admin. No automated verification is performed.",
      });
    } catch (error: any) {
      console.error("Get documents error:", error);
      return res.status(500).json({
        message: "Failed to get documents",
      });
    }
  }
);

export default router;
