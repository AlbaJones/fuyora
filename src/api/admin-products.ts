import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { ensureAdmin } from "../middleware/admin";
import { adminLimiter } from "../middleware/rate-limit";

const router = Router();

// Get pending products for review (admin only)
router.get(
  "/admin/products/pending",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { page = "1", limit = "20" } = req.query;

      const productService = req.scope.resolve("productService");
      const result = await productService.getPendingProducts(
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Get pending products error:", error);
      return res.status(500).json({
        message: "Failed to get pending products",
      });
    }
  }
);

// Approve product (admin only)
router.post(
  "/admin/products/:id/approve",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = req.user!.userId || (req.user as any).id;

      const productService = req.scope.resolve("productService");
      const product = await productService.approveProduct(id, adminId);

      // TODO: Send notification to seller about approval
      // const emailService = req.scope.resolve("emailService");
      // await emailService.sendProductApprovalEmail(product.seller_id, product);

      return res.json({
        message: "Product approved successfully",
        product,
      });
    } catch (error: any) {
      console.error("Approve product error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to approve product",
      });
    }
  }
);

// Reject product with reason (admin only)
router.post(
  "/admin/products/:id/reject",
  adminLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.userId || (req.user as any).id;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          message: "Rejection reason is required",
        });
      }

      if (reason.trim().length < 10) {
        return res.status(400).json({
          message: "Rejection reason must be at least 10 characters",
        });
      }

      const productService = req.scope.resolve("productService");
      const product = await productService.rejectProduct(id, adminId, reason);

      // TODO: Send notification to seller about rejection
      // const emailService = req.scope.resolve("emailService");
      // await emailService.sendProductRejectionEmail(product.seller_id, product, reason);

      return res.json({
        message: "Product rejected successfully",
        product,
      });
    } catch (error: any) {
      console.error("Reject product error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message.includes("required")) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to reject product",
      });
    }
  }
);

export default router;
