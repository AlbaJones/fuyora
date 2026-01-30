import { Router } from "express";
import { ensureAdmin } from "../middleware/admin";
import { BanDuration } from "../models/ban";

const router = Router();

/**
 * Ban a user by account
 * POST /admin/bans/user
 */
router.post("/user", ensureAdmin, async (req, res) => {
  try {
    const { user_id, reason, duration, expires_at } = req.body;

    if (!user_id || !reason || !duration) {
      return res.status(400).json({
        error: "user_id, reason, and duration are required",
      });
    }

    if (duration === BanDuration.TEMPORARY && !expires_at) {
      return res.status(400).json({
        error: "expires_at is required for temporary bans",
      });
    }

    const banService = req.scope.resolve("banService");
    
    const ban = await banService.banUser(
      user_id,
      reason,
      duration,
      req.user.id,
      expires_at ? new Date(expires_at) : undefined
    );

    // Force logout the user
    await banService.forceLogout(user_id);

    res.json({
      ban: {
        id: ban.id,
        user_id: ban.user_id,
        type: ban.type,
        duration: ban.duration,
        reason: ban.reason,
        banned_at: ban.banned_at,
        expires_at: ban.expires_at,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Ban an IP address
 * POST /admin/bans/ip
 */
router.post("/ip", ensureAdmin, async (req, res) => {
  try {
    const { ip_address, reason, duration, expires_at } = req.body;

    if (!ip_address || !reason || !duration) {
      return res.status(400).json({
        error: "ip_address, reason, and duration are required",
      });
    }

    if (duration === BanDuration.TEMPORARY && !expires_at) {
      return res.status(400).json({
        error: "expires_at is required for temporary bans",
      });
    }

    const banService = req.scope.resolve("banService");
    
    const ban = await banService.banIP(
      ip_address,
      reason,
      duration,
      req.user.id,
      expires_at ? new Date(expires_at) : undefined
    );

    res.json({
      ban: {
        id: ban.id,
        ip_address: ban.ip_address,
        type: ban.type,
        duration: ban.duration,
        reason: ban.reason,
        banned_at: ban.banned_at,
        expires_at: ban.expires_at,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Ban both user account and IP
 * POST /admin/bans/both
 */
router.post("/both", ensureAdmin, async (req, res) => {
  try {
    const { user_id, ip_address, reason, duration, expires_at } = req.body;

    if (!user_id || !ip_address || !reason || !duration) {
      return res.status(400).json({
        error: "user_id, ip_address, reason, and duration are required",
      });
    }

    if (duration === BanDuration.TEMPORARY && !expires_at) {
      return res.status(400).json({
        error: "expires_at is required for temporary bans",
      });
    }

    const banService = req.scope.resolve("banService");
    
    const ban = await banService.banBoth(
      user_id,
      ip_address,
      reason,
      duration,
      req.user.id,
      expires_at ? new Date(expires_at) : undefined
    );

    // Force logout the user
    await banService.forceLogout(user_id);

    res.json({
      ban: {
        id: ban.id,
        user_id: ban.user_id,
        ip_address: ban.ip_address,
        type: ban.type,
        duration: ban.duration,
        reason: ban.reason,
        banned_at: ban.banned_at,
        expires_at: ban.expires_at,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all active bans
 * GET /admin/bans
 */
router.get("/", ensureAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 50;

    const banService = req.scope.resolve("banService");
    const { bans, total } = await banService.listBans(page, perPage);

    res.json({
      bans: bans.map(ban => ({
        id: ban.id,
        user_id: ban.user_id,
        ip_address: ban.ip_address,
        type: ban.type,
        duration: ban.duration,
        reason: ban.reason,
        banned_at: ban.banned_at,
        expires_at: ban.expires_at,
        is_active: ban.is_active,
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
 * Unban (remove ban)
 * DELETE /admin/bans/:id
 */
router.delete("/:id", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const banService = req.scope.resolve("banService");
    await banService.unban(id, req.user.id);

    res.json({ success: true, message: "Ban removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
