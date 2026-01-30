import { BaseEntity } from "@medusajs/medusa";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum ProductStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  INACTIVE = "INACTIVE",
}

@Entity()
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar" })
  seller_id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ type: "varchar" })
  category!: string;

  @Column({
    type: "enum",
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status!: ProductStatus;

  @Column({ type: "jsonb", nullable: true })
  images!: string[] | null;

  @Column({ type: "boolean", default: false })
  digital_product!: boolean;

  @Column({ type: "varchar", nullable: true })
  file_url!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
}

@Entity()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar" })
  buyer_id!: string;

  @Index()
  @Column({ type: "varchar" })
  seller_id!: string;

  @Column({ type: "uuid" })
  product_id!: string;

  @Column({ type: "uuid", nullable: true })
  payment_id!: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ type: "jsonb", nullable: true })
  delivery_info!: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    notes?: string;
  } | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  paid_at!: Date | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  delivered_at!: Date | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  completed_at!: Date | null;

  @Column({ type: "timestamp with time zone", nullable: true })
  cancelled_at!: Date | null;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}

export enum ReviewType {
  BUYER_TO_SELLER = "BUYER_TO_SELLER",
  SELLER_TO_BUYER = "SELLER_TO_BUYER",
}

@Entity()
export class Review extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  order_id!: string;

  @Index()
  @Column({ type: "varchar" })
  reviewer_id!: string;

  @Index()
  @Column({ type: "varchar" })
  reviewee_id!: string;

  @Column({ type: "integer" })
  rating!: number; // 1-5

  @Column({ type: "text", nullable: true })
  comment!: string | null;

  @Column({
    type: "enum",
    enum: ReviewType,
  })
  type!: ReviewType;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}
