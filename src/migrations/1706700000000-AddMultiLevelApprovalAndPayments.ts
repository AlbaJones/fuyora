import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMultiLevelApprovalAndPayments1706700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add multi-level approval fields to kyc_submission
    await queryRunner.addColumn(
      "kyc_submission",
      new TableColumn({
        name: "approval_level",
        type: "integer",
        default: 1,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      "kyc_submission",
      new TableColumn({
        name: "approval_history",
        type: "jsonb",
        isNullable: true,
      })
    );

    // Create payment_status_enum
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'REFUNDED'
      );
    `);

    // Create stripe_account_status_enum
    await queryRunner.query(`
      CREATE TYPE "stripe_account_status_enum" AS ENUM (
        'PENDING',
        'ACTIVE',
        'RESTRICTED',
        'DISABLED'
      );
    `);

    // Create payment table
    await queryRunner.query(`
      CREATE TABLE "payment" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "buyer_id" varchar NOT NULL,
        "seller_id" varchar NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "platform_fee" decimal(10,2) NOT NULL,
        "seller_amount" decimal(10,2) NOT NULL,
        "currency" varchar NOT NULL DEFAULT 'BRL',
        "status" payment_status_enum NOT NULL DEFAULT 'PENDING',
        "stripe_payment_intent_id" varchar NULL,
        "stripe_charge_id" varchar NULL,
        "metadata" jsonb NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes on payment table
    await queryRunner.query(`
      CREATE INDEX "IDX_payment_buyer_id" ON "payment" ("buyer_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payment_seller_id" ON "payment" ("seller_id");
    `);

    // Create seller_account table
    await queryRunner.query(`
      CREATE TABLE "seller_account" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" varchar NOT NULL UNIQUE,
        "stripe_account_id" varchar NOT NULL UNIQUE,
        "status" stripe_account_status_enum NOT NULL DEFAULT 'PENDING',
        "charges_enabled" boolean NOT NULL DEFAULT false,
        "payouts_enabled" boolean NOT NULL DEFAULT false,
        "requirements" jsonb NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on seller_account
    await queryRunner.query(`
      CREATE INDEX "IDX_seller_account_user_id" ON "seller_account" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_seller_account_user_id";`);
    await queryRunner.query(`DROP INDEX "IDX_payment_seller_id";`);
    await queryRunner.query(`DROP INDEX "IDX_payment_buyer_id";`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "seller_account";`);
    await queryRunner.query(`DROP TABLE "payment";`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "stripe_account_status_enum";`);
    await queryRunner.query(`DROP TYPE "payment_status_enum";`);

    // Remove columns from kyc_submission
    await queryRunner.dropColumn("kyc_submission", "approval_history");
    await queryRunner.dropColumn("kyc_submission", "approval_level");
  }
}
