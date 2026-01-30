import { BaseEntity } from "@medusajs/medusa";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

export enum AuditAction {
  KYC_SUBMIT = "KYC_SUBMIT",
  KYC_REVIEW_APPROVE = "KYC_REVIEW_APPROVE",
  KYC_REVIEW_REJECT = "KYC_REVIEW_REJECT",
  USER_STATUS_CHANGE = "USER_STATUS_CHANGE",
}

@Entity()
export class AuditLog extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar" })
  actor_id!: string;

  @Index()
  @Column({ type: "varchar" })
  entity_type!: string;

  @Index()
  @Column({ type: "varchar" })
  entity_id!: string;

  @Column({
    type: "enum",
    enum: AuditAction,
  })
  action!: AuditAction;

  @Column({ type: "jsonb" })
  payload!: Record<string, any>;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;
}
