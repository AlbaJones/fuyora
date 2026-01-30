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
