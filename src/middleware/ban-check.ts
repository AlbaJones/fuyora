import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if user or IP is banned
 * Should be applied BEFORE authentication
 */
export async function checkBan(req: Request, res: Response, next: NextFunction) {
  try {
    const banService = req.scope.resolve("banService");
    
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check for ban
    const ban = await banService.checkBan(userId, ipAddress);

    if (ban) {
      // User/IP is banned
      return res.status(403).json({
        error: "Account or IP is banned",
        is_banned: true,
        ban_details: {
          reason: ban.reason,
          type: ban.duration === "TEMPORARY" ? "temporary" : "permanent",
          banned_at: ban.banned_at,
          expires_at: ban.expires_at,
        },
        message: "Sua conta está banida. Acesse /auth/ban-status para mais informações ou /unban-requests para solicitar desbanimento.",
      });
    }

    next();
  } catch (error) {
    console.error("[checkBan] Error checking ban:", error);
    next();
  }
}

/**
 * Middleware to block IP if banned
 * Should be one of the FIRST middlewares
 */
export async function blockBannedIP(req: Request, res: Response, next: NextFunction) {
  try {
    const banService = req.scope.resolve("banService");
    
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check only IP ban (no user check)
    const ban = await banService.checkBan(undefined, ipAddress);

    if (ban && (ban.type === "IP" || ban.type === "BOTH")) {
      // IP is banned
      return res.status(403).json({
        error: "IP address is banned",
        message: "Este endereço IP está banido. Entre em contato com o suporte.",
      });
    }

    next();
  } catch (error) {
    console.error("[blockBannedIP] Error checking IP ban:", error);
    next();
  }
}
