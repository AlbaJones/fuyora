import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { ensureAdmin } from "../middleware/admin";
import { adminLimiter } from "../middleware/rate-limit";
import { KycStatus } from "../models";

const router = Router();

// List all KYC submissions (admin only)
router.get(
  "/admin/kyc/submissions",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { status, page = "1", limit = "20" } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // Validate pagination
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          message: "Invalid page number",
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          message: "Invalid limit. Must be between 1 and 100",
        });
      }

      // Validate status if provided
      let statusFilter: KycStatus | undefined;
      if (status) {
        const validStatuses = ["EM_ANALISE", "APROVADO", "RECUSADO"];
        if (!validStatuses.includes(status as string)) {
          return res.status(400).json({
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          });
        }
        statusFilter = status as KycStatus;
      }

      const kycService = req.scope.resolve("kycService");
      const { submissions, total } = await kycService.getSubmissions(
        statusFilter,
        pageNum,
        limitNum
      );

      return res.json({
        submissions: submissions.map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          status: s.status,
          personal_data: s.personal_data,
          documents: s.documents,
          submitted_at: s.submitted_at,
          reviewed_at: s.reviewed_at,
          reviewer_id: s.reviewer_id,
          rejection_reason: s.rejection_reason,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          total_pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error("List KYC submissions error:", error);
      return res.status(500).json({
        message: "Failed to list KYC submissions",
      });
    }
  }
);

// Get specific KYC submission (admin only)
router.get(
  "/admin/kyc/submissions/:id",
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

      return res.json({
        id: submission.id,
        user_id: submission.user_id,
        status: submission.status,
        personal_data: submission.personal_data,
        documents: submission.documents,
        submitted_at: submission.submitted_at,
        reviewed_at: submission.reviewed_at,
        reviewer_id: submission.reviewer_id,
        rejection_reason: submission.rejection_reason,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
      });
    } catch (error: any) {
      console.error("Get KYC submission error:", error);
      return res.status(500).json({
        message: "Failed to get KYC submission",
      });
    }
  }
);

// Approve KYC submission (admin only)
router.post(
  "/admin/kyc/submissions/:id/approve",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const reviewerId = req.user!.userId || (req.user as any).id;

      const kycService = req.scope.resolve("kycService");
      const submission = await kycService.approveKyc(id, reviewerId);

      return res.json({
        id: submission.id,
        status: submission.status,
        reviewed_at: submission.reviewed_at,
        reviewer_id: submission.reviewer_id,
        message: "KYC submission approved successfully",
      });
    } catch (error: any) {
      console.error("Approve KYC error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message.includes("already reviewed")) {
        return res.status(409).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to approve KYC submission",
      });
    }
  }
);

// Reject KYC submission (admin only)
router.post(
  "/admin/kyc/submissions/:id/reject",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const reviewerId = req.user!.userId || (req.user as any).id;

      // Validate rejection reason
      if (!rejection_reason || typeof rejection_reason !== "string") {
        return res.status(400).json({
          message: "rejection_reason is required and must be a string",
        });
      }

      if (rejection_reason.trim().length === 0) {
        return res.status(400).json({
          message: "rejection_reason cannot be empty",
        });
      }

      const kycService = req.scope.resolve("kycService");
      const submission = await kycService.rejectKyc(
        id,
        reviewerId,
        rejection_reason.trim()
      );

      return res.json({
        id: submission.id,
        status: submission.status,
        reviewed_at: submission.reviewed_at,
        reviewer_id: submission.reviewer_id,
        rejection_reason: submission.rejection_reason,
        message: "KYC submission rejected successfully",
      });
    } catch (error: any) {
      console.error("Reject KYC error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message.includes("already reviewed")) {
        return res.status(409).json({
          message: error.message,
        });
      }

      if (error.message.includes("Rejection reason")) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to reject KYC submission",
      });
    }
  }
);

export default router;
