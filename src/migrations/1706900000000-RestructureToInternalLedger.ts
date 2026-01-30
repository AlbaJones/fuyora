import { MigrationInterface, QueryRunner } from "typeorm";

export class RestructureToInternalLedger1706900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop old Stripe Connect architecture (seller_account table)
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_account" CASCADE`);

    // 2. Create transaction_type enum
    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM (
        'SALE',
        'SALE_AVAILABLE',
        'WITHDRAWAL',
        'REFUND',
        'PLATFORM_FEE',
        'HOLD',
        'RELEASE',
        'CHARGEBACK',
        'ADJUSTMENT'
      )
    `);

    // 3. Create transaction_status enum
    await queryRunner.query(`
      CREATE TYPE "transaction_status_enum" AS ENUM (
        'PENDING',
        'COMPLETED',
        'FAILED',
        'REVERSED'
      )
    `);

    // 4. Create withdrawal_status enum
    await queryRunner.query(`
      CREATE TYPE "withdrawal_status_enum" AS ENUM (
        'PENDING',
        'APPROVED',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'CANCELLED'
      )
    `);

    // 5. Create seller_balance table
    await queryRunner.query(`
      CREATE TABLE "seller_balance" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "seller_id" varchar NOT NULL UNIQUE,
        "available_balance" decimal(12,2) NOT NULL DEFAULT 0,
        "pending_balance" decimal(12,2) NOT NULL DEFAULT 0,
        "held_balance" decimal(12,2) NOT NULL DEFAULT 0,
        "total_earned" decimal(12,2) NOT NULL DEFAULT 0,
        "total_withdrawn" decimal(12,2) NOT NULL DEFAULT 0,
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_seller_balance_seller_id" ON "seller_balance" ("seller_id")
    `);

    // 6. Create transaction table (ledger)
    await queryRunner.query(`
      CREATE TABLE "transaction" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "seller_id" varchar NOT NULL,
        "type" transaction_type_enum NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "balance_after" decimal(12,2) NOT NULL,
        "reference_id" varchar,
        "reference_type" varchar,
        "description" text,
        "status" transaction_status_enum NOT NULL DEFAULT 'COMPLETED',
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_seller_id" ON "transaction" ("seller_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_reference" ON "transaction" ("reference_id", "reference_type")
    `);

    // 7. Create withdrawal table
    await queryRunner.query(`
      CREATE TABLE "withdrawal" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "seller_id" varchar NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "status" withdrawal_status_enum NOT NULL DEFAULT 'PENDING',
        "bank_info" jsonb NOT NULL,
        "stripe_transfer_id" varchar,
        "approved_by" varchar,
        "processed_by" varchar,
        "rejection_reason" text,
        "failure_reason" text,
        "requested_at" timestamp with time zone,
        "approved_at" timestamp with time zone,
        "processed_at" timestamp with time zone,
        "completed_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_withdrawal_seller_id" ON "withdrawal" ("seller_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_withdrawal_status" ON "withdrawal" ("status")
    `);

    // 8. Update payment table - rename seller_amount to seller_net_amount
    await queryRunner.query(`
      ALTER TABLE "payment" RENAME COLUMN "seller_amount" TO "seller_net_amount"
    `);

    // 9. Add comment to payment table explaining new architecture
    await queryRunner.query(`
      COMMENT ON TABLE "payment" IS 'Payments go to platform Stripe account. Seller receives credit in internal ledger.'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the changes
    await queryRunner.query(`DROP TABLE IF EXISTS "withdrawal" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transaction" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_balance" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "withdrawal_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_type_enum"`);

    // Rename back
    await queryRunner.query(`
      ALTER TABLE "payment" RENAME COLUMN "seller_net_amount" TO "seller_amount"
    `);

    // Recreate seller_account table (old architecture)
    await queryRunner.query(`
      CREATE TYPE "stripe_account_status_enum" AS ENUM (
        'PENDING',
        'ACTIVE',
        'RESTRICTED',
        'DISABLED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "seller_account" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" varchar NOT NULL UNIQUE,
        "stripe_account_id" varchar NOT NULL UNIQUE,
        "status" stripe_account_status_enum NOT NULL DEFAULT 'PENDING',
        "charges_enabled" boolean NOT NULL DEFAULT false,
        "payouts_enabled" boolean NOT NULL DEFAULT false,
        "requirements" jsonb,
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      )
    `);
  }
}
