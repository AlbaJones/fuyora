import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import { Ban, BanType, BanDuration } from "../models/ban";
import { AuditLog, AuditAction } from "../models/audit-log";

class BanService extends TransactionBaseService {
  private banRepository: Repository<Ban>;
  private auditLogRepository: Repository<AuditLog>;

  constructor({ banRepository, auditLogRepository }) {
    super(arguments[0]);
    this.banRepository = banRepository;
    this.auditLogRepository = auditLogRepository;
  }

  /**
   * Ban a user by account
   */
  async banUser(
    userId: string,
    reason: string,
    duration: BanDuration,
    bannedBy: string,
    expiresAt?: Date
  ): Promise<Ban> {
    // Deactivate any existing bans for this user
    await this.banRepository.update(
      { user_id: userId, is_active: true },
      { is_active: false }
    );

    const ban = this.banRepository.create({
      user_id: userId,
      type: BanType.ACCOUNT,
      duration,
      reason,
      banned_by: bannedBy,
      expires_at: expiresAt,
      is_active: true,
    });

    const savedBan = await this.banRepository.save(ban);

    // Log the ban action
    await this.auditLogRepository.save({
      actor_id: bannedBy,
      entity_type: "user",
      entity_id: userId,
      action: "USER_BANNED" as AuditAction,
      payload: {
        ban_id: savedBan.id,
        type: BanType.ACCOUNT,
        duration,
        reason,
        expires_at: expiresAt,
      },
    });

    return savedBan;
  }

  /**
   * Ban an IP address
   */
  async banIP(
    ipAddress: string,
    reason: string,
    duration: BanDuration,
    bannedBy: string,
    expiresAt?: Date
  ): Promise<Ban> {
    // Deactivate any existing bans for this IP
    await this.banRepository.update(
      { ip_address: ipAddress, is_active: true },
      { is_active: false }
    );

    const ban = this.banRepository.create({
      ip_address: ipAddress,
      type: BanType.IP,
      duration,
      reason,
      banned_by: bannedBy,
      expires_at: expiresAt,
      is_active: true,
    });

    const savedBan = await this.banRepository.save(ban);

    // Log the ban action
    await this.auditLogRepository.save({
      actor_id: bannedBy,
      entity_type: "ip_address",
      entity_id: ipAddress,
      action: "IP_BANNED" as AuditAction,
      payload: {
        ban_id: savedBan.id,
        type: BanType.IP,
        duration,
        reason,
        expires_at: expiresAt,
      },
    });

    return savedBan;
  }

  /**
   * Ban both user account and IP
   */
  async banBoth(
    userId: string,
    ipAddress: string,
    reason: string,
    duration: BanDuration,
    bannedBy: string,
    expiresAt?: Date
  ): Promise<Ban> {
    // Deactivate existing bans
    await this.banRepository.update(
      { user_id: userId, is_active: true },
      { is_active: false }
    );
    await this.banRepository.update(
      { ip_address: ipAddress, is_active: true },
      { is_active: false }
    );

    const ban = this.banRepository.create({
      user_id: userId,
      ip_address: ipAddress,
      type: BanType.BOTH,
      duration,
      reason,
      banned_by: bannedBy,
      expires_at: expiresAt,
      is_active: true,
    });

    const savedBan = await this.banRepository.save(ban);

    // Log the ban action
    await this.auditLogRepository.save({
      actor_id: bannedBy,
      entity_type: "user",
      entity_id: userId,
      action: "USER_AND_IP_BANNED" as AuditAction,
      payload: {
        ban_id: savedBan.id,
        type: BanType.BOTH,
        ip_address: ipAddress,
        duration,
        reason,
        expires_at: expiresAt,
      },
    });

    return savedBan;
  }

  /**
   * Check if a user or IP is banned
   * Returns ban details if banned, null otherwise
   */
  async checkBan(userId?: string, ipAddress?: string): Promise<Ban | null> {
    const now = new Date();
    const query = this.banRepository
      .createQueryBuilder("ban")
      .where("ban.is_active = :active", { active: true });

    if (userId && ipAddress) {
      query.andWhere(
        "(ban.user_id = :userId OR ban.ip_address = :ipAddress)",
        { userId, ipAddress }
      );
    } else if (userId) {
      query.andWhere("ban.user_id = :userId", { userId });
    } else if (ipAddress) {
      query.andWhere("ban.ip_address = :ipAddress", { ipAddress });
    } else {
      return null;
    }

    const ban = await query.getOne();

    if (!ban) {
      return null;
    }

    // Check if temporary ban has expired
    if (ban.duration === BanDuration.TEMPORARY && ban.expires_at) {
      if (now > ban.expires_at) {
        // Ban has expired, deactivate it
        ban.is_active = false;
        await this.banRepository.save(ban);
        return null;
      }
    }

    return ban;
  }

  /**
   * Unban (remove ban)
   */
  async unban(banId: string, unbannedBy: string): Promise<void> {
    const ban = await this.banRepository.findOne({ where: { id: banId } });
    
    if (!ban) {
      throw new Error("Ban not found");
    }

    ban.is_active = false;
    await this.banRepository.save(ban);

    // Log the unban action
    await this.auditLogRepository.save({
      actor_id: unbannedBy,
      entity_type: ban.user_id ? "user" : "ip_address",
      entity_id: ban.user_id || ban.ip_address,
      action: "USER_UNBANNED" as AuditAction,
      payload: {
        ban_id: banId,
        original_reason: ban.reason,
        unbanned_by: unbannedBy,
      },
    });
  }

  /**
   * List all active bans (admin)
   */
  async listBans(page: number = 1, perPage: number = 50): Promise<{ bans: Ban[]; total: number }> {
    const [bans, total] = await this.banRepository.findAndCount({
      where: { is_active: true },
      order: { banned_at: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { bans, total };
  }

  /**
   * Force logout user (invalidate sessions)
   * This would integrate with session management system
   */
  async forceLogout(userId: string): Promise<void> {
    // In a real implementation, this would:
    // 1. Invalidate all JWT tokens for this user
    // 2. Remove all sessions from Redis
    // 3. Add user_id to a blacklist cache
    
    // For now, we log the action
    console.log(`[BanService] Force logout user ${userId}`);
    
    // This would typically be handled by:
    // - Adding to JWT blacklist
    // - Clearing Redis sessions
    // - Notifying websocket connections
  }
}

export default BanService;
