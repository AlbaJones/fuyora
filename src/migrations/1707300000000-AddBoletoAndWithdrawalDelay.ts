import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddBoletoAndWithdrawalDelay1707300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add payment_method enum type if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payment_method_enum AS ENUM ('CREDIT_CARD', 'BOLETO', 'PIX');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add EXPIRED status to payment_status_enum
    await queryRunner.query(`
      ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'EXPIRED';
    `);

    // Add boleto fields to payment table
    await queryRunner.addColumn(
      "payment",
      new TableColumn({
        name: "payment_method",
        type: "payment_method_enum",
        default: "'CREDIT_CARD'",
      })
    );

    await queryRunner.addColumn(
      "payment",
      new TableColumn({
        name: "boleto_code",
        type: "varchar",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "payment",
      new TableColumn({
        name: "boleto_expires_at",
        type: "timestamp with time zone",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "payment",
      new TableColumn({
        name: "boleto_url",
        type: "varchar",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "payment",
      new TableColumn({
        name: "boleto_barcode",
        type: "varchar",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "payment",
      new TableColumn({
        name: "pagseguro_transaction_id",
        type: "varchar",
        isNullable: true,
      })
    );

    // Add WAITING_DELAY status to withdrawal_status_enum
    await queryRunner.query(`
      ALTER TYPE withdrawal_status_enum ADD VALUE IF NOT EXISTS 'WAITING_DELAY';
    `);

    // Add withdrawal delay fields to withdrawal table
    await queryRunner.addColumn(
      "withdrawal",
      new TableColumn({
        name: "delay_hours",
        type: "integer",
        default: 48,
      })
    );

    await queryRunner.addColumn(
      "withdrawal",
      new TableColumn({
        name: "can_process_at",
        type: "timestamp with time zone",
        isNullable: true,
      })
    );

    // Add anticipation fields to withdrawal table
    await queryRunner.addColumn(
      "withdrawal",
      new TableColumn({
        name: "anticipated",
        type: "boolean",
        default: false,
      })
    );

    await queryRunner.addColumn(
      "withdrawal",
      new TableColumn({
        name: "anticipated_by",
        type: "uuid",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "withdrawal",
      new TableColumn({
        name: "anticipation_reason",
        type: "text",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "withdrawal",
      new TableColumn({
        name: "anticipated_at",
        type: "timestamp with time zone",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "withdrawal",
      new TableColumn({
        name: "admin_ip",
        type: "varchar",
        isNullable: true,
      })
    );

    // Create index on boleto_expires_at for efficient expiration queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_boleto_expires_at 
      ON payment(boleto_expires_at) 
      WHERE payment_method = 'BOLETO' AND status = 'PENDING';
    `);

    // Create index on can_process_at for efficient withdrawal processing queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_withdrawal_can_process_at 
      ON withdrawal(can_process_at) 
      WHERE status = 'WAITING_DELAY';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payment_boleto_expires_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_withdrawal_can_process_at;`);

    // Drop withdrawal columns
    await queryRunner.dropColumn("withdrawal", "admin_ip");
    await queryRunner.dropColumn("withdrawal", "anticipated_at");
    await queryRunner.dropColumn("withdrawal", "anticipation_reason");
    await queryRunner.dropColumn("withdrawal", "anticipated_by");
    await queryRunner.dropColumn("withdrawal", "anticipated");
    await queryRunner.dropColumn("withdrawal", "can_process_at");
    await queryRunner.dropColumn("withdrawal", "delay_hours");

    // Drop payment columns
    await queryRunner.dropColumn("payment", "pagseguro_transaction_id");
    await queryRunner.dropColumn("payment", "boleto_barcode");
    await queryRunner.dropColumn("payment", "boleto_url");
    await queryRunner.dropColumn("payment", "boleto_expires_at");
    await queryRunner.dropColumn("payment", "boleto_code");
    await queryRunner.dropColumn("payment", "payment_method");

    // Note: We don't drop enum values as PostgreSQL doesn't support it easily
    // They will remain in the database but unused
  }
}
