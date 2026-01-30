import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMarketplaceTables1706800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create product_status_enum
    await queryRunner.query(`
      CREATE TYPE "product_status_enum" AS ENUM (
        'DRAFT',
        'ACTIVE',
        'SOLD',
        'INACTIVE'
      );
    `);

    // Create order_status_enum
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM (
        'PENDING',
        'PAID',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
        'DISPUTED'
      );
    `);

    // Create review_type_enum
    await queryRunner.query(`
      CREATE TYPE "review_type_enum" AS ENUM (
        'BUYER_TO_SELLER',
        'SELLER_TO_BUYER'
      );
    `);

    // Create product table
    await queryRunner.query(`
      CREATE TABLE "product" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "seller_id" varchar NOT NULL,
        "title" varchar NOT NULL,
        "description" text NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "category" varchar NOT NULL,
        "status" product_status_enum NOT NULL DEFAULT 'DRAFT',
        "images" jsonb NULL,
        "digital_product" boolean NOT NULL DEFAULT false,
        "file_url" varchar NULL,
        "metadata" jsonb NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes on product table
    await queryRunner.query(`
      CREATE INDEX "IDX_product_seller_id" ON "product" ("seller_id");
    `);

    // Create order table
    await queryRunner.query(`
      CREATE TABLE "order" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "buyer_id" varchar NOT NULL,
        "seller_id" varchar NOT NULL,
        "product_id" uuid NOT NULL,
        "payment_id" uuid NULL,
        "amount" decimal(10,2) NOT NULL,
        "status" order_status_enum NOT NULL DEFAULT 'PENDING',
        "delivery_info" jsonb NULL,
        "paid_at" timestamp with time zone NULL,
        "delivered_at" timestamp with time zone NULL,
        "completed_at" timestamp with time zone NULL,
        "cancelled_at" timestamp with time zone NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes on order table
    await queryRunner.query(`
      CREATE INDEX "IDX_order_buyer_id" ON "order" ("buyer_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_seller_id" ON "order" ("seller_id");
    `);

    // Create review table
    await queryRunner.query(`
      CREATE TABLE "review" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "reviewer_id" varchar NOT NULL,
        "reviewee_id" varchar NOT NULL,
        "rating" integer NOT NULL,
        "comment" text NULL,
        "type" review_type_enum NOT NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes on review table
    await queryRunner.query(`
      CREATE INDEX "IDX_review_order_id" ON "review" ("order_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_review_reviewer_id" ON "review" ("reviewer_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_review_reviewee_id" ON "review" ("reviewee_id");
    `);

    // Create unique constraint to prevent duplicate reviews
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_review_order_reviewer" ON "review" ("order_id", "reviewer_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "UQ_review_order_reviewer";`);
    await queryRunner.query(`DROP INDEX "IDX_review_reviewee_id";`);
    await queryRunner.query(`DROP INDEX "IDX_review_reviewer_id";`);
    await queryRunner.query(`DROP INDEX "IDX_review_order_id";`);
    await queryRunner.query(`DROP INDEX "IDX_order_seller_id";`);
    await queryRunner.query(`DROP INDEX "IDX_order_buyer_id";`);
    await queryRunner.query(`DROP INDEX "IDX_product_seller_id";`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "review";`);
    await queryRunner.query(`DROP TABLE "order";`);
    await queryRunner.query(`DROP TABLE "product";`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "review_type_enum";`);
    await queryRunner.query(`DROP TYPE "order_status_enum";`);
    await queryRunner.query(`DROP TYPE "product_status_enum";`);
  }
}
