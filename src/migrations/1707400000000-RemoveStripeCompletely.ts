import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Final Migration: Complete Stripe Removal
 * 
 * This migration removes ALL Stripe-related fields and tables,
 * standardizing the platform to use EXCLUSIVELY PagSeguro.
 * 
 * Changes:
 * 1. Remove stripe_payment_intent_id and stripe_charge_id from payment table
 * 2. Add provider_transaction_id (generic field) to payment table
 * 3. Add payment_provider field (default 'pagseguro') to payment table
 * 4. Update existing provider fields from 'stripe' to 'pagseguro'
 * 5. Remove stripe_transfer_id from withdrawal table (if exists)
 * 6. Drop seller_account table (if exists - was for Stripe Connect)
 * 7. Drop stripe_account_status_enum (if exists)
 */
export class RemoveStripeCompletely1707400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new generic fields to payment table
    await queryRunner.query(`
      ALTER TABLE "payment"
      ADD COLUMN IF NOT EXISTS "provider_transaction_id" varchar,
      ADD COLUMN IF NOT EXISTS "payment_provider" varchar DEFAULT 'pagseguro'
    `);

    // 2. Migrate existing stripe data to generic fields (if any exists)
    await queryRunner.query(`
      UPDATE "payment"
      SET "provider_transaction_id" = COALESCE("stripe_payment_intent_id", "stripe_charge_id")
      WHERE "stripe_payment_intent_id" IS NOT NULL OR "stripe_charge_id" IS NOT NULL
    `);

    // 3. Remove Stripe-specific columns from payment table
    await queryRunner.query(`
      ALTER TABLE "payment"
      DROP COLUMN IF EXISTS "stripe_payment_intent_id",
      DROP COLUMN IF EXISTS "stripe_charge_id"
    `);

    // 4. Update all 'stripe' provider values to 'pagseguro' in payment table
    await queryRunner.query(`
      UPDATE "payment"
      SET "provider" = 'pagseguro'
      WHERE "provider" = 'stripe'
    `);

    // 5. Remove stripe_transfer_id from withdrawal table (if exists)
    await queryRunner.query(`
      ALTER TABLE "withdrawal"
      DROP COLUMN IF EXISTS "stripe_transfer_id"
    `);

    // 6. Update all 'stripe' provider values to 'pagseguro' in withdrawal table
    await queryRunner.query(`
      UPDATE "withdrawal"
      SET "provider" = 'pagseguro'
      WHERE "provider" = 'stripe'
    `);

    // 7. Drop seller_account table (was used for Stripe Connect - no longer needed)
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_account" CASCADE`);

    // 8. Drop stripe_account_status_enum if it exists
    await queryRunner.query(`DROP TYPE IF EXISTS "stripe_account_status_enum"`);

    console.log("✅ Stripe completely removed. Platform now uses EXCLUSIVELY PagSeguro.");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is intentionally NOT reversible
    // Once Stripe is removed, we don't support going back
    console.warn(
      "⚠️  WARNING: This migration cannot be reversed. Stripe removal is permanent."
    );
    console.warn(
      "The platform is now standardized on PagSeguro as the exclusive payment provider."
    );
    throw new Error(
      "Cannot revert Stripe removal. This is a one-way migration to PagSeguro-only."
    );
  }
}
