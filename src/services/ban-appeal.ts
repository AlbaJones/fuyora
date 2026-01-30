import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import {
  BanAppealRequest,
  UnbanRequestStatus,
  PreviousBanType,
  PixKeyType,
  RefundDecision,
} from "../models/ban";
import { AuditLog, AuditAction } from "../models/audit-log";

/**
 * Service for managing detailed ban appeal requests
 * Serviço para gerenciar pedidos de apelação de banimento
 */
class BanAppealService extends TransactionBaseService {
  private banAppealRepository: Repository<BanAppealRequest>;
  private auditLogRepository: Repository<AuditLog>;

  constructor({ banAppealRepository, auditLogRepository }) {
    super(arguments[0]);
    this.banAppealRepository = banAppealRepository;
    this.auditLogRepository = auditLogRepository;
  }

  /**
   * Validate CPF format and checksum
   */
  private validateCPF(cpf: string): boolean {
    const cpfDigits = cpf.replace(/\D/g, "");

    if (cpfDigits.length !== 11) return false;

    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cpfDigits)) return false;

    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpfDigits.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    let firstCheckDigit = remainder >= 10 ? 0 : remainder;

    if (firstCheckDigit !== parseInt(cpfDigits.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpfDigits.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    let secondCheckDigit = remainder >= 10 ? 0 : remainder;

    if (secondCheckDigit !== parseInt(cpfDigits.charAt(10))) return false;

    return true;
  }

  /**
   * Format CPF to standard format (###.###.###-##)
   */
  private formatCPF(cpf: string): string {
    const cpfDigits = cpf.replace(/\D/g, "");
    return cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  /**
   * Create a detailed ban appeal request
   * Criar um pedido detalhado de apelação de banimento
   */
  async createAppeal(data: {
    userId?: string;
    username: string;
    email: string;
    fullName: string;
    cpf: string;
    previouslyBanned: boolean;
    previousBanType?: PreviousBanType;
    knowsViolatedRule: boolean;
    violatedRuleDescription?: string;
    appealMessage: string;
    termsAcknowledged: boolean;
    informationTruthful: boolean;
    falseInfoConsequenceAcknowledged: boolean;
    pixKey: string;
    pixKeyType: PixKeyType;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<BanAppealRequest> {
    // Validate CPF
    if (!this.validateCPF(data.cpf)) {
      throw new Error("CPF inválido");
    }

    // Validate all confirmations
    if (
      !data.termsAcknowledged ||
      !data.informationTruthful ||
      !data.falseInfoConsequenceAcknowledged
    ) {
      throw new Error("Todas as confirmações são obrigatórias");
    }

    // Validate appeal message length
    if (!data.appealMessage || data.appealMessage.length < 50) {
      throw new Error(
        "A mensagem de apelação deve ter pelo menos 50 caracteres"
      );
    }

    // Validate previous ban type if previously banned
    if (data.previouslyBanned && !data.previousBanType) {
      throw new Error(
        "Tipo de banimento anterior é obrigatório quando você já foi banido"
      );
    }

    const appeal = this.banAppealRepository.create({
      user_id: data.userId || null,
      username: data.username,
      email: data.email,
      full_name: data.fullName,
      cpf: this.formatCPF(data.cpf),
      previously_banned: data.previouslyBanned,
      previous_ban_type: data.previousBanType || null,
      knows_violated_rule: data.knowsViolatedRule,
      violated_rule_description: data.violatedRuleDescription || null,
      appeal_message: data.appealMessage,
      terms_acknowledged: data.termsAcknowledged,
      information_truthful: data.informationTruthful,
      false_info_consequence_acknowledged: data.falseInfoConsequenceAcknowledged,
      pix_key: data.pixKey,
      pix_key_type: data.pixKeyType,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
      status: UnbanRequestStatus.PENDING,
    });

    const savedAppeal = await this.banAppealRepository.save(appeal);

    // Log the appeal submission
    await this.auditLogRepository.save({
      actor_id: data.userId || "anonymous",
      entity_type: "ban_appeal",
      entity_id: savedAppeal.id,
      action: "BAN_APPEAL_CREATED" as AuditAction,
      payload: {
        email: data.email,
        cpf: this.formatCPF(data.cpf),
        previously_banned: data.previouslyBanned,
      },
    });

    return savedAppeal;
  }

  /**
   * List ban appeals (admin)
   */
  async listAppeals(
    status?: UnbanRequestStatus,
    page: number = 1,
    perPage: number = 50
  ): Promise<{ appeals: BanAppealRequest[]; total: number }> {
    const query = this.banAppealRepository.createQueryBuilder("appeal");

    if (status) {
      query.where("appeal.status = :status", { status });
    }

    query.orderBy("appeal.submitted_at", "DESC");
    query.skip((page - 1) * perPage);
    query.take(perPage);

    const [appeals, total] = await query.getManyAndCount();

    return { appeals, total };
  }

  /**
   * Get a specific ban appeal
   */
  async getAppeal(appealId: string): Promise<BanAppealRequest> {
    const appeal = await this.banAppealRepository.findOne({
      where: { id: appealId },
    });

    if (!appeal) {
      throw new Error("Pedido de apelação não encontrado");
    }

    return appeal;
  }

  /**
   * Get user's ban history
   */
  async getUserBanHistory(userId: string): Promise<{
    totalAppeals: number;
    approvedAppeals: number;
    deniedAppeals: number;
    pendingAppeals: number;
  }> {
    const appeals = await this.banAppealRepository.find({
      where: { user_id: userId },
    });

    return {
      totalAppeals: appeals.length,
      approvedAppeals: appeals.filter((a) => a.status === UnbanRequestStatus.APPROVED).length,
      deniedAppeals: appeals.filter((a) => a.status === UnbanRequestStatus.DENIED).length,
      pendingAppeals: appeals.filter((a) => a.status === UnbanRequestStatus.PENDING).length,
    };
  }

  /**
   * Approve an appeal (admin) - Remove ban
   */
  async approveAppeal(
    appealId: string,
    reviewerId: string,
    adminNotes?: string
  ): Promise<BanAppealRequest> {
    const appeal = await this.getAppeal(appealId);

    if (
      appeal.status !== UnbanRequestStatus.PENDING &&
      appeal.status !== UnbanRequestStatus.UNDER_REVIEW
    ) {
      throw new Error("Este pedido já foi revisado");
    }

    appeal.status = UnbanRequestStatus.APPROVED;
    appeal.reviewed_by = reviewerId;
    appeal.reviewed_at = new Date();
    appeal.admin_notes = adminNotes;

    const updatedAppeal = await this.banAppealRepository.save(appeal);

    // Log the approval
    await this.auditLogRepository.save({
      actor_id: reviewerId,
      entity_type: "ban_appeal",
      entity_id: appealId,
      action: "BAN_APPEAL_APPROVED" as AuditAction,
      payload: {
        user_id: appeal.user_id,
        email: appeal.email,
        admin_notes: adminNotes,
      },
    });

    return updatedAppeal;
  }

  /**
   * Deny an appeal (admin) - Keep ban
   */
  async denyAppeal(
    appealId: string,
    reviewerId: string,
    adminNotes?: string
  ): Promise<BanAppealRequest> {
    const appeal = await this.getAppeal(appealId);

    if (
      appeal.status !== UnbanRequestStatus.PENDING &&
      appeal.status !== UnbanRequestStatus.UNDER_REVIEW
    ) {
      throw new Error("Este pedido já foi revisado");
    }

    appeal.status = UnbanRequestStatus.DENIED;
    appeal.reviewed_by = reviewerId;
    appeal.reviewed_at = new Date();
    appeal.admin_notes = adminNotes;

    const updatedAppeal = await this.banAppealRepository.save(appeal);

    // Log the denial
    await this.auditLogRepository.save({
      actor_id: reviewerId,
      entity_type: "ban_appeal",
      entity_id: appealId,
      action: "BAN_APPEAL_DENIED" as AuditAction,
      payload: {
        user_id: appeal.user_id,
        email: appeal.email,
        admin_notes: adminNotes,
      },
    });

    return updatedAppeal;
  }

  /**
   * Deny appeal and close account financially (admin)
   * This is the most severe action
   */
  async denyAndCloseFinancially(
    appealId: string,
    reviewerId: string,
    adminNotes: string,
    refundDecision: RefundDecision,
    refundAmount?: number,
    refundPixKey?: string
  ): Promise<BanAppealRequest> {
    const appeal = await this.getAppeal(appealId);

    if (
      appeal.status !== UnbanRequestStatus.PENDING &&
      appeal.status !== UnbanRequestStatus.UNDER_REVIEW
    ) {
      throw new Error("Este pedido já foi revisado");
    }

    appeal.status = UnbanRequestStatus.DENIED;
    appeal.reviewed_by = reviewerId;
    appeal.reviewed_at = new Date();
    appeal.admin_notes = adminNotes;
    appeal.close_account_financially = true;
    appeal.refund_decision = refundDecision;
    appeal.refund_amount = refundAmount || null;
    appeal.refund_pix_key = refundPixKey || appeal.pix_key; // Use provided or original

    const updatedAppeal = await this.banAppealRepository.save(appeal);

    // Log the financial closure
    await this.auditLogRepository.save({
      actor_id: reviewerId,
      entity_type: "ban_appeal",
      entity_id: appealId,
      action: "BAN_APPEAL_DENIED_FINANCIALLY_CLOSED" as AuditAction,
      payload: {
        user_id: appeal.user_id,
        email: appeal.email,
        admin_notes: adminNotes,
        refund_decision: refundDecision,
        refund_amount: refundAmount,
        refund_pix_key: refundPixKey || appeal.pix_key,
      },
    });

    return updatedAppeal;
  }

  /**
   * Mark refund as processed (admin)
   * Called AFTER admin manually processes the refund
   */
  async markRefundProcessed(
    appealId: string,
    adminId: string
  ): Promise<BanAppealRequest> {
    const appeal = await this.getAppeal(appealId);

    if (appeal.refund_decision !== RefundDecision.REFUND) {
      throw new Error("Este pedido não foi aprovado para reembolso");
    }

    appeal.refund_processed_at = new Date();
    appeal.refund_processed_by = adminId;

    const updatedAppeal = await this.banAppealRepository.save(appeal);

    // Log the refund processing
    await this.auditLogRepository.save({
      actor_id: adminId,
      entity_type: "ban_appeal",
      entity_id: appealId,
      action: "BAN_APPEAL_REFUND_PROCESSED" as AuditAction,
      payload: {
        user_id: appeal.user_id,
        refund_amount: appeal.refund_amount,
        refund_pix_key: appeal.refund_pix_key,
      },
    });

    return updatedAppeal;
  }

  /**
   * Set appeal to under review
   */
  async setUnderReview(
    appealId: string,
    reviewerId: string
  ): Promise<BanAppealRequest> {
    const appeal = await this.getAppeal(appealId);

    if (appeal.status !== UnbanRequestStatus.PENDING) {
      throw new Error("Este pedido não está pendente");
    }

    appeal.status = UnbanRequestStatus.UNDER_REVIEW;
    appeal.reviewed_by = reviewerId;

    return await this.banAppealRepository.save(appeal);
  }
}

export default BanAppealService;
