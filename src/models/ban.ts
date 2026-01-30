import { BeforeInsert, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "@medusajs/medusa";

export enum BanType {
  ACCOUNT = "ACCOUNT",
  IP = "IP",
  BOTH = "BOTH",
}

export enum BanDuration {
  TEMPORARY = "TEMPORARY",
  PERMANENT = "PERMANENT",
}

@Entity()
@Index(["user_id", "is_active"])
@Index(["ip_address", "is_active"])
export class Ban extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({
    type: "enum",
    enum: BanType,
  })
  type: BanType;

  @Column({
    type: "enum",
    enum: BanDuration,
  })
  duration: BanDuration;

  @Column({ type: "text" })
  reason: string;

  @Column()
  banned_by: string; // Admin user_id

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  banned_at: Date;

  @Column({ type: "timestamp", nullable: true })
  expires_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @BeforeInsert()
  private validateBan() {
    if (!this.user_id && !this.ip_address) {
      throw new Error("Ban must have either user_id or ip_address");
    }
    
    if (this.duration === BanDuration.TEMPORARY && !this.expires_at) {
      throw new Error("Temporary ban must have expires_at");
    }

    if (this.duration === BanDuration.PERMANENT && this.expires_at) {
      throw new Error("Permanent ban cannot have expires_at");
    }
  }
}

export enum UnbanRequestStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  DENIED = "DENIED",
}

export enum PreviousBanType {
  TEMPORARY = "TEMPORARY",
  PERMANENT = "PERMANENT",
  UNKNOWN = "UNKNOWN",
}

export enum PixKeyType {
  CPF = "CPF",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  RANDOM = "RANDOM",
}

export enum RefundDecision {
  REFUND = "REFUND",
  NO_REFUND = "NO_REFUND",
  PENDING = "PENDING",
}

@Entity()
@Index(["user_id"])
@Index(["status"])
export class UnbanRequest extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  email: string;

  @Column({ type: "text" })
  reason: string;

  @Column({ type: "text" })
  message: string;

  @Column({
    type: "enum",
    enum: UnbanRequestStatus,
    default: UnbanRequestStatus.PENDING,
  })
  status: UnbanRequestStatus;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  submitted_at: Date;

  @Column({ nullable: true })
  reviewed_by: string; // Admin user_id

  @Column({ type: "timestamp", nullable: true })
  reviewed_at: Date;

  @Column({ type: "text", nullable: true })
  admin_notes: string;
}

/**
 * BanAppealRequest - Complete detailed ban appeal form
 * Formulário completo e obrigatório de apelação de banimento
 */
@Entity()
@Index(["user_id"])
@Index(["status"])
@Index(["cpf"])
export class BanAppealRequest extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Section 1: Identification (Identificação do usuário)
  @Column({ nullable: true })
  user_id: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  full_name: string;

  @Column()
  cpf: string;

  // Section 2: Ban History (Histórico de banimento)
  @Column({ default: false })
  previously_banned: boolean;

  @Column({
    type: "enum",
    enum: PreviousBanType,
    nullable: true,
  })
  previous_ban_type: PreviousBanType;

  // Section 3: Rule Recognition (Reconhecimento de regras)
  @Column({ default: false })
  knows_violated_rule: boolean;

  @Column({ type: "text", nullable: true })
  violated_rule_description: string;

  // Section 4: Appeal Message (Mensagem de apelação)
  @Column({ type: "text" })
  appeal_message: string;

  // Section 5: Confirmations (Confirmações obrigatórias)
  @Column({ default: false })
  terms_acknowledged: boolean;

  @Column({ default: false })
  information_truthful: boolean;

  @Column({ default: false })
  false_info_consequence_acknowledged: boolean;

  // Section 6: Financial Info (Informação financeira)
  @Column()
  pix_key: string;

  @Column({
    type: "enum",
    enum: PixKeyType,
  })
  pix_key_type: PixKeyType;

  // Metadata
  @Column({ nullable: true })
  ip_address: string;

  @Column({ type: "text", nullable: true })
  user_agent: string;

  // Status and Review
  @Column({
    type: "enum",
    enum: UnbanRequestStatus,
    default: UnbanRequestStatus.PENDING,
  })
  status: UnbanRequestStatus;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  submitted_at: Date;

  @Column({ nullable: true })
  reviewed_by: string; // Admin user_id

  @Column({ type: "timestamp", nullable: true })
  reviewed_at: Date;

  @Column({ type: "text", nullable: true })
  admin_notes: string;

  // Financial Closure (only set if admin denies + closes account)
  @Column({ default: false })
  close_account_financially: boolean;

  @Column({
    type: "enum",
    enum: RefundDecision,
    nullable: true,
  })
  refund_decision: RefundDecision;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  refund_amount: number;

  @Column({ nullable: true })
  refund_pix_key: string; // Can be different from original pix_key

  @Column({ type: "timestamp", nullable: true })
  refund_processed_at: Date;

  @Column({ nullable: true })
  refund_processed_by: string; // Admin user_id

  @BeforeInsert()
  private validateAppeal() {
    // Validate all required fields
    if (!this.username || !this.email || !this.full_name || !this.cpf) {
      throw new Error("All identification fields are required");
    }

    // Validate CPF format (11 digits)
    const cpfDigits = this.cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      throw new Error("CPF must have 11 digits");
    }

    // Validate appeal message minimum length
    if (!this.appeal_message || this.appeal_message.length < 50) {
      throw new Error("Appeal message must be at least 50 characters");
    }

    // Validate all confirmations are checked
    if (!this.terms_acknowledged || !this.information_truthful || !this.false_info_consequence_acknowledged) {
      throw new Error("All confirmation checkboxes must be checked");
    }

    // Validate PIX key
    if (!this.pix_key || !this.pix_key_type) {
      throw new Error("PIX key and type are required");
    }

    // If previously banned, must specify type
    if (this.previously_banned && !this.previous_ban_type) {
      throw new Error("Previous ban type is required when previously_banned is true");
    }

    // If knows violated rule, should have description (optional but encouraged)
    // This is just a soft validation, we don't throw error
  }
}
