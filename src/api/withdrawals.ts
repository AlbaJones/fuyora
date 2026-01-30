import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { ensureAdmin } from "../middleware/admin";
import { WithdrawalService } from "../services/withdrawal";
import { LedgerService } from "../services/ledger";
import { authLimiter } from "../middleware/rate-limit";

const router = Router();

/**
 * GET /seller/balance
 * Get seller's current balance
 */
router.get(
  "/seller/balance",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const manager = (req as any).scope.resolve("manager");

      const ledgerService = new LedgerService(manager);
      const balance = await ledgerService.getBalance(userId);

      return res.json({
        available_balance: balance.available_balance,
        pending_balance: balance.pending_balance,
        held_balance: balance.held_balance,
        total_earned: balance.total_earned,
        total_withdrawn: balance.total_withdrawn,
      });
    } catch (error: any) {
      console.error("Failed to get balance:", error);
      return res.status(500).json({
        error: "Failed to get balance",
      });
    }
  }
);

/**
 * GET /seller/transactions
 * Get seller's transaction history
 */
router.get(
  "/seller/transactions",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const manager = (req as any).scope.resolve("manager");
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const ledgerService = new LedgerService(manager);
      const result = await ledgerService.getTransactions(userId, limit, offset);

      return res.json(result);
    } catch (error: any) {
      console.error("Failed to get transactions:", error);
      return res.status(500).json({
        error: "Failed to get transactions",
      });
    }
  }
);

/**
 * POST /seller/withdrawals/request
 * Request a withdrawal
 */
router.post(
  "/seller/withdrawals/request",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const manager = (req as any).scope.resolve("manager");
      const { amount, bank_info } = req.body;

      if (!amount || !bank_info) {
        return res.status(400).json({
          error: "Amount and bank_info are required",
        });
      }

      const withdrawalService = new WithdrawalService(manager);
      const withdrawal = await withdrawalService.requestWithdrawal(
        userId,
        parseFloat(amount),
        bank_info
      );

      return res.json({
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        requested_at: withdrawal.requested_at,
        message:
          "Withdrawal requested successfully. Processing typically takes 2 business days.",
      });
    } catch (error: any) {
      console.error("Failed to request withdrawal:", error);
      return res.status(400).json({
        error: error.message || "Failed to request withdrawal",
      });
    }
  }
);

/**
 * GET /seller/withdrawals
 * Get seller's withdrawals
 */
router.get(
  "/seller/withdrawals",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const manager = (req as any).scope.resolve("manager");
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const withdrawalService = new WithdrawalService(manager);
      const result = await withdrawalService.getSellerWithdrawals(
        userId,
        limit,
        offset
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Failed to get withdrawals:", error);
      return res.status(500).json({
        error: "Failed to get withdrawals",
      });
    }
  }
);

/**
 * POST /seller/withdrawals/:id/cancel
 * Cancel a pending withdrawal
 */
router.post(
  "/seller/withdrawals/:id/cancel",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const manager = (req as any).scope.resolve("manager");
      const { id } = req.params;
      const { reason } = req.body;

      const withdrawalService = new WithdrawalService(manager);
      
      // Verify ownership
      const withdrawal = await withdrawalService.getWithdrawal(id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (withdrawal.seller_id !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updated = await withdrawalService.cancelWithdrawal(
        id,
        reason || "Cancelled by seller",
        userId
      );

      return res.json({
        id: updated.id,
        status: updated.status,
        message: "Withdrawal cancelled successfully",
      });
    } catch (error: any) {
      console.error("Failed to cancel withdrawal:", error);
      return res.status(400).json({
        error: error.message || "Failed to cancel withdrawal",
      });
    }
  }
);

/**
 * GET /admin/withdrawals
 * List all withdrawals (admin)
 */
router.get(
  "/admin/withdrawals",
  authLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const manager = (req as any).scope.resolve("manager");
      const status = req.query.status as any;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const withdrawalService = new WithdrawalService(manager);
      const result = await withdrawalService.getAllWithdrawals(
        status,
        limit,
        offset
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Failed to get withdrawals:", error);
      return res.status(500).json({
        error: "Failed to get withdrawals",
      });
    }
  }
);

/**
 * POST /admin/withdrawals/:id/approve
 * Approve a withdrawal (admin)
 */
router.post(
  "/admin/withdrawals/:id/approve",
  authLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const manager = (req as any).scope.resolve("manager");
      const { id } = req.params;

      const withdrawalService = new WithdrawalService(manager);
      const withdrawal = await withdrawalService.approveWithdrawal(id, userId);

      return res.json({
        id: withdrawal.id,
        status: withdrawal.status,
        approved_at: withdrawal.approved_at,
        message: "Withdrawal approved successfully",
      });
    } catch (error: any) {
      console.error("Failed to approve withdrawal:", error);
      return res.status(400).json({
        error: error.message || "Failed to approve withdrawal",
      });
    }
  }
);

/**
 * POST /admin/withdrawals/:id/process
 * Process a withdrawal (admin - triggers Stripe transfer)
 */
router.post(
  "/admin/withdrawals/:id/process",
  authLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const manager = (req as any).scope.resolve("manager");
      const { id } = req.params;

      const withdrawalService = new WithdrawalService(manager);
      const withdrawal = await withdrawalService.processWithdrawal(id, userId);

      return res.json({
        id: withdrawal.id,
        status: withdrawal.status,
        stripe_transfer_id: withdrawal.stripe_transfer_id,
        processed_at: withdrawal.processed_at,
        completed_at: withdrawal.completed_at,
        message:
          "Withdrawal processed successfully. Funds will arrive in 2 business days.",
      });
    } catch (error: any) {
      console.error("Failed to process withdrawal:", error);
      return res.status(400).json({
        error: error.message || "Failed to process withdrawal",
      });
    }
  }
);

/**
 * POST /admin/withdrawals/:id/reject
 * Reject a withdrawal (admin)
 */
router.post(
  "/admin/withdrawals/:id/reject",
  authLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const manager = (req as any).scope.resolve("manager");
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: "Rejection reason is required",
        });
      }

      const withdrawalService = new WithdrawalService(manager);
      const withdrawal = await withdrawalService.cancelWithdrawal(
        id,
        reason,
        userId
      );

      return res.json({
        id: withdrawal.id,
        status: withdrawal.status,
        rejection_reason: withdrawal.rejection_reason,
        message: "Withdrawal rejected",
      });
    } catch (error: any) {
      console.error("Failed to reject withdrawal:", error);
      return res.status(400).json({
        error: error.message || "Failed to reject withdrawal",
      });
    }
  }
);

/**
 * POST /admin/withdrawals/:id/anticipate
 * Anticipate a withdrawal (admin - skip 48h delay)
 * Requires reason for audit trail
 */
router.post(
  "/admin/withdrawals/:id/anticipate",
  authLimiter,
  ensureAuthenticated,
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const manager = (req as any).scope.resolve("manager");
      const { id } = req.params;
      const { reason } = req.body;
      const adminIp = req.ip || req.socket.remoteAddress;

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          error: "Anticipation reason is required (minimum 10 characters)",
        });
      }

      const withdrawalService = new WithdrawalService(manager);
      const withdrawal = await withdrawalService.anticipateWithdrawal(
        id,
        userId,
        reason,
        adminIp
      );

      return res.json({
        id: withdrawal.id,
        status: withdrawal.status,
        anticipated: withdrawal.anticipated,
        anticipated_by: withdrawal.anticipated_by,
        anticipation_reason: withdrawal.anticipation_reason,
        anticipated_at: withdrawal.anticipated_at,
        can_process_at: withdrawal.can_process_at,
        message:
          "Withdrawal anticipated successfully. Will be processed in the next scheduled run.",
      });
    } catch (error: any) {
      console.error("Failed to anticipate withdrawal:", error);
      return res.status(400).json({
        error: error.message || "Failed to anticipate withdrawal",
      });
    }
  }
);

export default router;
