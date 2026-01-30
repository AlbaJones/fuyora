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
