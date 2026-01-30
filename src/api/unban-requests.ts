import { Router } from "express";
import { ensureAdmin } from "../middleware/admin";
import { UnbanRequestStatus } from "../models/ban";

const router = Router();

/**
 * Submit an unban request
 * POST /unban-requests
 * NO AUTH REQUIRED - banned users can submit
 */
router.post("/", async (req, res) => {
  try {
    const { user_id, email, reason, message } = req.body;

    if (!email || !reason || !message) {
      return res.status(400).json({
        error: "email, reason, and message are required",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const unbanRequestService = req.scope.resolve("unbanRequestService");
    
    const request = await unbanRequestService.createRequest(
      user_id || null,
      email,
      reason,
      message
    );

    res.json({
      success: true,
      request: {
        id: request.id,
        email: request.email,
        status: request.status,
        submitted_at: request.submitted_at,
      },
      message: "Seu pedido de desbanimento foi enviado e será analisado em breve.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check ban status
 * GET /auth/ban-status
 * NO AUTH REQUIRED - anyone can check
 */
router.get("/ban-status", async (req, res) => {
  try {
    const { user_id } = req.query;
    const ip_address = req.ip || req.connection.remoteAddress;

    if (!user_id && !ip_address) {
      return res.status(400).json({
        error: "user_id query parameter or IP address is required",
      });
    }

    const banService = req.scope.resolve("banService");
    const ban = await banService.checkBan(
      user_id as string,
      ip_address
    );

    if (!ban) {
      return res.json({
        is_banned: false,
      });
    }

    res.json({
      is_banned: true,
      reason: ban.reason,
      type: ban.duration === "TEMPORARY" ? "temporary" : "permanent",
      banned_at: ban.banned_at,
      expires_at: ban.expires_at,
      can_request_unban: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * List unban requests (admin)
 * GET /admin/unban-requests
 */
router.get("/admin", ensureAdmin, async (req, res) => {
  try {
    const status = req.query.status as UnbanRequestStatus;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 50;

    const unbanRequestService = req.scope.resolve("unbanRequestService");
    const { requests, total } = await unbanRequestService.listRequests(
      status,
      page,
      perPage
    );

    res.json({
      requests: requests.map(request => ({
        id: request.id,
        user_id: request.user_id,
        email: request.email,
        reason: request.reason,
        message: request.message,
        status: request.status,
        submitted_at: request.submitted_at,
        reviewed_by: request.reviewed_by,
        reviewed_at: request.reviewed_at,
        admin_notes: request.admin_notes,
      })),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve an unban request (admin)
 * POST /admin/unban-requests/:id/approve
 */
router.post("/admin/:id/approve", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const unbanRequestService = req.scope.resolve("unbanRequestService");
    const banService = req.scope.resolve("banService");

    // Get the request
    const request = await unbanRequestService.getRequest(id);

    // Approve the request
    const updatedRequest = await unbanRequestService.approveRequest(
      id,
      req.user.id,
      admin_notes
    );

    // If user_id exists, unban the user
    if (request.user_id) {
      // Find active bans for this user
      const ban = await banService.checkBan(request.user_id);
      if (ban) {
        await banService.unban(ban.id, req.user.id);
      }
    }

    res.json({
      success: true,
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        reviewed_at: updatedRequest.reviewed_at,
      },
      message: "Unban request approved and user unbanned",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Deny an unban request (admin)
 * POST /admin/unban-requests/:id/deny
 */
router.post("/admin/:id/deny", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const unbanRequestService = req.scope.resolve("unbanRequestService");
    
    const updatedRequest = await unbanRequestService.denyRequest(
      id,
      req.user.id,
      admin_notes
    );

    res.json({
      success: true,
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        reviewed_at: updatedRequest.reviewed_at,
      },
      message: "Unban request denied",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
