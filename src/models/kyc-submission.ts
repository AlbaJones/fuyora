import { BaseEntity } from "@medusajs/medusa";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum KycStatus {
  EM_ANALISE = "EM_ANALISE",
  APROVADO = "APROVADO",
  RECUSADO = "RECUSADO",
}

@Entity()
export class KycSubmission extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar" })
  user_id!: string;

  @Column({
    type: "enum",
    enum: KycStatus,
    default: KycStatus.EM_ANALISE,
  })
  status!: KycStatus;

  @Column({ type: "text", nullable: true })
  rejection_reason!: string | null;

  @Column({ type: "jsonb" })
  personal_data!: {
    full_name: string;
    cpf: string;
    address: {
      line: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };

  @Column({ type: "jsonb" })
  documents!: {
    doc_url: string;
    selfie_url: string;
    proof_url: string;
  };

  @Column({ type: "timestamp with time zone" })
  submitted_at!: Date;

  @Column({ type: "timestamp with time zone", nullable: true })
  reviewed_at!: Date | null;

  @Column({ type: "varchar", nullable: true })
  reviewer_id!: string | null;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}
