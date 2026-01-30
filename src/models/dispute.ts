import { BaseEntity } from "@medusajs/medusa";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum DisputeStatus {
  OPEN = "OPEN",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED_BUYER = "RESOLVED_BUYER", // Resolved in favor of buyer
  RESOLVED_SELLER = "RESOLVED_SELLER", // Resolved in favor of seller
  CLOSED = "CLOSED",
}

export enum DisputeType {
  NOT_RECEIVED = "NOT_RECEIVED", // Product not received
  NOT_AS_DESCRIBED = "NOT_AS_DESCRIBED", // Product different from description
  DAMAGED = "DAMAGED", // Product damaged/defective
  UNAUTHORIZED = "UNAUTHORIZED", // Unauthorized transaction
  OTHER = "OTHER",
}

/**
 * Dispute - Customer dispute/chargeback management
 * Disputes block withdrawals but DO NOT block balance release
 */
@Entity()
export class Dispute extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar" })
  buyer_id!: string;

  @Index()
  @Column({ type: "varchar" })
  seller_id!: string;

  @Index()
  @Column({ type: "varchar" })
  order_id!: string;

  @Column({
    type: "enum",
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status!: DisputeStatus;

  @Column({
    type: "enum",
    enum: DisputeType,
  })
  type!: DisputeType;

  @Column({ type: "text" })
  description!: string;

  // Buyer's evidence
  @Column({ type: "jsonb", nullable: true })
  buyer_evidence!: {
    images?: string[];
    documents?: string[];
    notes?: string;
  } | null;

  // Seller's response
  @Column({ type: "jsonb", nullable: true })
  seller_evidence!: {
    images?: string[];
    documents?: string[];
    notes?: string;
    tracking_number?: string;
  } | null;

  @Column({ type: "text", nullable: true })
  seller_response!: string | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  seller_responded_at!: Date | null;

  // Admin resolution
  @Column({ type: "text", nullable: true })
  resolution!: string | null; // Admin's decision/notes

  @Column({ type: "varchar", nullable: true })
  resolved_by!: string | null; // Admin user_id

  @Column({ type: "timestamp with time zone", nullable: true })
  resolved_at!: Date | null;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}
