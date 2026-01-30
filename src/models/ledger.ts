import { BaseEntity } from "@medusajs/medusa";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * SellerBalance - Tracks internal ledger balance for each seller
 * All funds are held by platform, not Stripe Connect accounts
 */
@Entity()
export class SellerBalance extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", unique: true })
  seller_id!: string;

  // Available for withdrawal
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  available_balance!: number;

  // Pending (not yet available - e.g., recent sales, disputes)
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  pending_balance!: number;

  // Held funds (disputes, fraud investigation)
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  held_balance!: number;

  // Total earned lifetime (for analytics)
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  total_earned!: number;

  // Total withdrawn lifetime
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  total_withdrawn!: number;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}

export enum TransactionType {
  SALE = "SALE", // Sale credit (pending initially)
  SALE_AVAILABLE = "SALE_AVAILABLE", // Sale becomes available
  WITHDRAWAL = "WITHDRAWAL", // Withdrawal debit
  REFUND = "REFUND", // Refund debit
  PLATFORM_FEE = "PLATFORM_FEE", // Platform fee debit
  HOLD = "HOLD", // Move to held
  RELEASE = "RELEASE", // Release from held
  CHARGEBACK = "CHARGEBACK", // Chargeback debit
  ADJUSTMENT = "ADJUSTMENT", // Manual adjustment (admin)
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REVERSED = "REVERSED",
}

/**
 * Transaction - Ledger entries (immutable audit trail)
 * Every balance change creates a transaction record
 */
@Entity()
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar" })
  seller_id!: string;

  @Column({
    type: "enum",
    enum: TransactionType,
  })
  type!: TransactionType;

  // Positive = credit, Negative = debit
  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: number;

  // Balance after this transaction
  @Column({ type: "decimal", precision: 12, scale: 2 })
  balance_after!: number;

  // Reference to related entity (order_id, withdrawal_id, payment_id, etc.)
  @Column({ type: "varchar", nullable: true })
  reference_id!: string | null;

  @Column({ type: "varchar", nullable: true })
  reference_type!: string | null; // 'order', 'withdrawal', 'payment', etc.

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status!: TransactionStatus;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;
}

export enum WithdrawalStatus {
  PENDING = "PENDING", // Requested by seller
  APPROVED = "APPROVED", // Approved by admin, ready to process
  WAITING_DELAY = "WAITING_DELAY", // Waiting for 48h delay
  PROCESSING = "PROCESSING", // Being processed via payment provider
  COMPLETED = "COMPLETED", // Successfully transferred
  FAILED = "FAILED", // Failed to transfer
  CANCELLED = "CANCELLED", // Cancelled by admin or seller
}

/**
 * Withdrawal - Seller withdrawal requests
 * Processed manually via Stripe transfers/payouts
 */
@Entity()
export class Withdrawal extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar" })
  seller_id!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: number;

  @Column({
    type: "enum",
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status!: WithdrawalStatus;

  // Bank account information (PIX, bank transfer, etc.)
  @Column({ type: "jsonb" })
  bank_info!: {
    account_type: "PIX" | "BANK_TRANSFER";
    pix_key?: string;
    bank_code?: string;
    account_number?: string;
    account_holder_name?: string;
    account_holder_document?: string;
  };

  @Column({ type: "varchar", nullable: true })
  stripe_transfer_id!: string | null;

  // Withdrawal delay fields (48h default)
  @Column({ type: "integer", default: 48 })
  delay_hours!: number;

  @Column({ type: "timestamp with time zone", nullable: true })
  can_process_at!: Date | null; // When withdrawal can be processed

  // Admin anticipation fields
  @Column({ type: "boolean", default: false })
  anticipated!: boolean;

  @Column({ type: "varchar", nullable: true })
  anticipated_by!: string | null; // Admin user_id

  @Column({ type: "text", nullable: true })
  anticipation_reason!: string | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  anticipated_at!: Date | null;

  @Column({ type: "varchar", nullable: true })
  admin_ip!: string | null;

  // Processing details
  @Column({ type: "varchar", nullable: true })
  approved_by!: string | null; // Admin user_id

  @Column({ type: "varchar", nullable: true })
  processed_by!: string | null; // Admin user_id who processed

  @Column({ type: "text", nullable: true })
  rejection_reason!: string | null;

  @Column({ type: "text", nullable: true })
  failure_reason!: string | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  requested_at!: Date | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  approved_at!: Date | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  processed_at!: Date | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  completed_at!: Date | null;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}
