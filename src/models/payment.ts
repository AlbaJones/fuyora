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

  @Column({ type: "decimal", precision: 10, scale: 2 })
  platform_fee!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  seller_amount!: number;

  @Column({ type: "varchar" })
  currency!: string;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({ type: "varchar", nullable: true })
  stripe_payment_intent_id!: string | null;

  @Column({ type: "varchar", nullable: true })
  stripe_charge_id!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}

export enum StripeAccountStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  RESTRICTED = "RESTRICTED",
  DISABLED = "DISABLED",
}

@Entity()
export class SellerAccount extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", unique: true })
  user_id!: string;

  @Column({ type: "varchar", unique: true })
  stripe_account_id!: string;

  @Column({
    type: "enum",
    enum: StripeAccountStatus,
    default: StripeAccountStatus.PENDING,
  })
  status!: StripeAccountStatus;

  @Column({ type: "boolean", default: false })
  charges_enabled!: boolean;

  @Column({ type: "boolean", default: false })
  payouts_enabled!: boolean;

  @Column({ type: "jsonb", nullable: true })
  requirements!: Record<string, any> | null;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}
