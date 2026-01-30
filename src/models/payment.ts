import { BaseEntity } from "@medusajs/medusa";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  EXPIRED = "EXPIRED", // For boleto expiration
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  BOLETO = "BOLETO",
  PIX = "PIX",
}

@Entity()
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar" })
  buyer_id!: string;

  @Index()
  @Column({ type: "varchar" })
  seller_id!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  // Platform fee (calculated from amount)
  @Column({ type: "decimal", precision: 10, scale: 2 })
  platform_fee!: number;

  // Net amount credited to seller (amount - platform_fee)
  @Column({ type: "decimal", precision: 10, scale: 2 })
  seller_net_amount!: number;

  @Column({ type: "varchar" })
  currency!: string;

  @Column({
    type: "enum",
    enum: PaymentMethod,
    default: PaymentMethod.CREDIT_CARD,
  })
  payment_method!: PaymentMethod;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  // Boleto specific fields
  @Column({ type: "varchar", nullable: true })
  boleto_code!: string | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  boleto_expires_at!: Date | null;

  @Column({ type: "varchar", nullable: true })
  boleto_url!: string | null;

  @Column({ type: "varchar", nullable: true })
  boleto_barcode!: string | null;

  // PagSeguro payment fields
  @Column({ type: "varchar", nullable: true })
  pagseguro_transaction_id!: string | null;

  // Generic provider transaction ID (replaces Stripe-specific fields)
  @Column({ type: "varchar", nullable: true })
  provider_transaction_id!: string | null;

  @Column({ type: "varchar", default: "pagseguro" })
  payment_provider!: string;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}
