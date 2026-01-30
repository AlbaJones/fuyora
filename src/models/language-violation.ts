import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user";

export enum ViolationSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export enum ViolationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  DISMISSED = "DISMISSED"
}

export enum ViolationAction {
  WARNING = "WARNING",
  BAN_24H = "BAN_24H",
  BAN_72H = "BAN_72H",
  BAN_7D = "BAN_7D",
  BAN_PERMANENT = "BAN_PERMANENT"
}

@Entity()
export class LanguageViolation extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column("text")
  content: string;

  @Column("simple-array")
  detected_words: string[];

  @Column({
    type: "enum",
    enum: ViolationSeverity,
    default: ViolationSeverity.LOW
  })
  severity: ViolationSeverity;

  @Column({
    type: "enum",
    enum: ViolationStatus,
    default: ViolationStatus.PENDING
  })
  status: ViolationStatus;

  @Column({
    type: "enum",
    enum: ViolationAction,
    nullable: true
  })
  action_taken: ViolationAction;

  @Column({ nullable: true })
  reviewed_by: string;

  @Column({ type: "timestamp", nullable: true })
  reviewed_at: Date;

  @Column({ default: false })
  appeal_submitted: boolean;

  @Column("text", { nullable: true })
  appeal_message: string;

  @Column({ type: "timestamp", nullable: true })
  appeal_reviewed_at: Date;

  @Column({ nullable: true })
  ban_id: string;

  @CreateDateColumn()
  created_at: Date;
}
