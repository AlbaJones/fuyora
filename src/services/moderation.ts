import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import { LanguageViolation, ViolationAction, ViolationSeverity, ViolationStatus } from "../models/language-violation";
import { checkLanguage } from "../utils/prohibited-words";
import { AuditLog } from "../models/audit-log";

/**
 * ModerationService
 * Handles language violation detection, tracking, and progressive penalties
 */
class ModerationService extends TransactionBaseService {
  protected languageViolationRepository_: Repository<LanguageViolation>;
  protected auditLogRepository_: Repository<AuditLog>;
  protected banService_: any;
  protected eventBusService_: any;

  constructor(container) {
    super(container);
    this.languageViolationRepository_ = container.languageViolationRepository;
    this.auditLogRepository_ = container.auditLogRepository;
    this.banService_ = container.banService;
    this.eventBusService_ = container.eventBusService;
  }

  /**
   * Check text for inappropriate language
   */
  async checkText(text: string) {
    return checkLanguage(text);
  }

  /**
   * Flag a message and create violation record
   */
  async flagMessage(userId: string, content: string, detectedWords: string[], severity: ViolationSeverity) {
    const violation = this.languageViolationRepository_.create({
      user_id: userId,
      content,
      detected_words: detectedWords,
      severity,
      status: ViolationStatus.PENDING
    });

    await this.languageViolationRepository_.save(violation);

    // Create audit log
    await this.createAuditLog(userId, "LANGUAGE_VIOLATION_DETECTED", {
      violation_id: violation.id,
      detected_words: detectedWords,
      severity
    });

    return violation;
  }

  /**
   * Get user's violation history
   */
  async getViolationHistory(userId: string) {
    return await this.languageViolationRepository_.find({
      where: { user_id: userId },
      order: { created_at: "DESC" }
    });
  }

  /**
   * Calculate penalty based on user's violation history
   */
  async calculatePenalty(userId: string, currentSeverity: ViolationSeverity): Promise<ViolationAction> {
    const history = await this.getViolationHistory(userId);
    
    // Count confirmed violations in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentViolations = history.filter(v => 
      v.status === ViolationStatus.CONFIRMED &&
      v.created_at >= thirtyDaysAgo
    );

    const violationCount = recentViolations.length;

    // Progressive penalties
    if (violationCount === 0) {
      // First violation: WARNING only
      return ViolationAction.WARNING;
    } else if (violationCount === 1) {
      // Second violation: 24h ban
      return ViolationAction.BAN_24H;
    } else if (violationCount === 2) {
      // Third violation: 72h ban
      return ViolationAction.BAN_72H;
    } else {
      // Fourth+ violation: 7 days ban
      return ViolationAction.BAN_7D;
    }
  }

  /**
   * Apply penalty to user
   */
  async applyPenalty(violationId: string, action: ViolationAction, adminId?: string) {
    const violation = await this.languageViolationRepository_.findOne({
      where: { id: violationId }
    });

    if (!violation) {
      throw new Error("Violation not found");
    }

    violation.action_taken = action;
    violation.status = ViolationStatus.CONFIRMED;
    violation.reviewed_by = adminId;
    violation.reviewed_at = new Date();

    await this.languageViolationRepository_.save(violation);

    // Apply ban if needed
    if (action !== ViolationAction.WARNING) {
      const duration = this.getBanDuration(action);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + duration);

      const ban = await this.banService_.banUser(
        violation.user_id,
        `Linguagem inadequada: ${violation.detected_words.join(", ")}`,
        "TEMPORARY",
        expiresAt
      );

      violation.ban_id = ban.id;
      await this.languageViolationRepository_.save(violation);

      // Emit event
      await this.eventBusService_.emit("user.language_banned", {
        user_id: violation.user_id,
        violation_id: violation.id,
        duration,
        action
      });
    }

    // Create audit log
    await this.createAuditLog(violation.user_id, "LANGUAGE_PENALTY_APPLIED", {
      violation_id: violation.id,
      action,
      admin_id: adminId
    });

    return violation;
  }

  /**
   * Get ban duration in hours based on action
   */
  private getBanDuration(action: ViolationAction): number {
    switch (action) {
      case ViolationAction.BAN_24H:
        return 24;
      case ViolationAction.BAN_72H:
        return 72;
      case ViolationAction.BAN_7D:
        return 168; // 7 days
      default:
        return 0;
    }
  }

  /**
   * Dismiss violation (false positive)
   */
  async dismissViolation(violationId: string, adminId: string, reason?: string) {
    const violation = await this.languageViolationRepository_.findOne({
      where: { id: violationId }
    });

    if (!violation) {
      throw new Error("Violation not found");
    }

    violation.status = ViolationStatus.DISMISSED;
    violation.reviewed_by = adminId;
    violation.reviewed_at = new Date();

    await this.languageViolationRepository_.save(violation);

    // Create audit log
    await this.createAuditLog(violation.user_id, "LANGUAGE_VIOLATION_DISMISSED", {
      violation_id: violation.id,
      admin_id: adminId,
      reason
    });

    return violation;
  }

  /**
   * Submit appeal for violation
   */
  async submitAppeal(violationId: string, userId: string, message: string) {
    const violation = await this.languageViolationRepository_.findOne({
      where: { id: violationId, user_id: userId }
    });

    if (!violation) {
      throw new Error("Violation not found");
    }

    if (violation.appeal_submitted) {
      throw new Error("Appeal already submitted");
    }

    violation.appeal_submitted = true;
    violation.appeal_message = message;

    await this.languageViolationRepository_.save(violation);

    // Create audit log
    await this.createAuditLog(userId, "LANGUAGE_VIOLATION_APPEAL_SUBMITTED", {
      violation_id: violation.id,
      message
    });

    return violation;
  }

  /**
   * List violations (admin)
   */
  async listViolations(filters?: {
    status?: ViolationStatus;
    severity?: ViolationSeverity;
    userId?: string;
  }, page: number = 1, perPage: number = 20) {
    const query: any = {};
    
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.severity) {
      query.severity = filters.severity;
    }
    if (filters?.userId) {
      query.user_id = filters.userId;
    }

    const [violations, total] = await this.languageViolationRepository_.findAndCount({
      where: query,
      order: { created_at: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage
    });

    return {
      violations,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage)
    };
  }

  /**
   * Create audit log
   */
  private async createAuditLog(userId: string, action: string, payload: any) {
    const log = this.auditLogRepository_.create({
      actor_id: userId,
      entity_type: "language_violation",
      entity_id: payload.violation_id || null,
      action,
      payload
    });

    await this.auditLogRepository_.save(log);
  }
}

export default ModerationService;
