import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDisputeSystemAndTemporalRelease1707000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dispute_status_enum
    await queryRunner.query(`
      CREATE TYPE dispute_status_enum AS ENUM (
        'OPEN',
        'UNDER_REVIEW',
        'RESOLVED_BUYER',
        'RESOLVED_SELLER',
        'CLOSED'
      )
    `);

    // Create dispute_type_enum
    await queryRunner.query(`
      CREATE TYPE dispute_type_enum AS ENUM (
        'NOT_RECEIVED',
        'NOT_AS_DESCRIBED',
        'DAMAGED',
        'UNAUTHORIZED',
        'OTHER'
      )
    `);

    // Create dispute table
    await queryRunner.query(`
      CREATE TABLE dispute (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        buyer_id VARCHAR NOT NULL,
        seller_id VARCHAR NOT NULL,
        order_id VARCHAR NOT NULL,
        status dispute_status_enum NOT NULL DEFAULT 'OPEN',
        type dispute_type_enum NOT NULL,
        description TEXT NOT NULL,
        buyer_evidence JSONB,
        seller_evidence JSONB,
        seller_response TEXT,
        seller_responded_at TIMESTAMP WITH TIME ZONE,
        resolution TEXT,
        resolved_by VARCHAR,
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for dispute
    await queryRunner.query(`
      CREATE INDEX idx_dispute_buyer_id ON dispute(buyer_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_dispute_seller_id ON dispute(seller_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_dispute_order_id ON dispute(order_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_dispute_status ON dispute(status)
    `);

    // Update payment and withdrawal tables to add provider field
    await queryRunner.query(`
      ALTER TABLE payment 
      ADD COLUMN IF NOT EXISTS provider VARCHAR DEFAULT 'stripe'
    `);

    await queryRunner.query(`
      ALTER TABLE withdrawal 
      ADD COLUMN IF NOT EXISTS provider VARCHAR DEFAULT 'stripe'
    `);

    console.log("Migration: Dispute system and temporal release added");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_dispute_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_dispute_order_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_dispute_seller_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_dispute_buyer_id`);

    // Drop dispute table
    await queryRunner.query(`DROP TABLE IF EXISTS dispute`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS dispute_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS dispute_status_enum`);

    // Remove provider columns
    await queryRunner.query(`
      ALTER TABLE payment DROP COLUMN IF EXISTS provider
    `);

    await queryRunner.query(`
      ALTER TABLE withdrawal DROP COLUMN IF EXISTS provider
    `);

    console.log("Migration: Dispute system and temporal release removed");
  }
}
