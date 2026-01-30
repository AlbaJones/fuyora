import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateBanAppealSystem1707200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums for ban appeal system
    await queryRunner.query(`
      CREATE TYPE previous_ban_type_enum AS ENUM (
        'TEMPORARY',
        'PERMANENT',
        'UNKNOWN'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE pix_key_type_enum AS ENUM (
        'CPF',
        'EMAIL',
        'PHONE',
        'RANDOM'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE refund_decision_enum AS ENUM (
        'REFUND',
        'NO_REFUND',
        'PENDING'
      );
    `);

    // Create ban_appeal_request table
    await queryRunner.createTable(
      new Table({
        name: "ban_appeal_request",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          // Section 1: Identification
          {
            name: "user_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "username",
            type: "varchar",
          },
          {
            name: "email",
            type: "varchar",
          },
          {
            name: "full_name",
            type: "varchar",
          },
          {
            name: "cpf",
            type: "varchar",
          },
          // Section 2: Ban History
          {
            name: "previously_banned",
            type: "boolean",
            default: false,
          },
          {
            name: "previous_ban_type",
            type: "previous_ban_type_enum",
            isNullable: true,
          },
          // Section 3: Rule Recognition
          {
            name: "knows_violated_rule",
            type: "boolean",
            default: false,
          },
          {
            name: "violated_rule_description",
            type: "text",
            isNullable: true,
          },
          // Section 4: Appeal Message
          {
            name: "appeal_message",
            type: "text",
          },
          // Section 5: Confirmations
          {
            name: "terms_acknowledged",
            type: "boolean",
            default: false,
          },
          {
            name: "information_truthful",
            type: "boolean",
            default: false,
          },
          {
            name: "false_info_consequence_acknowledged",
            type: "boolean",
            default: false,
          },
          // Section 6: Financial Info
          {
            name: "pix_key",
            type: "varchar",
          },
          {
            name: "pix_key_type",
            type: "pix_key_type_enum",
          },
          // Metadata
          {
            name: "ip_address",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "user_agent",
            type: "text",
            isNullable: true,
          },
          // Status and Review
          {
            name: "status",
            type: "unban_request_status_enum",
            default: "'PENDING'",
          },
          {
            name: "submitted_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "reviewed_by",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "reviewed_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "admin_notes",
            type: "text",
            isNullable: true,
          },
          // Financial Closure
          {
            name: "close_account_financially",
            type: "boolean",
            default: false,
          },
          {
            name: "refund_decision",
            type: "refund_decision_enum",
            isNullable: true,
          },
          {
            name: "refund_amount",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "refund_pix_key",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "refund_processed_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "refund_processed_by",
            type: "varchar",
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes for ban_appeal_request
    await queryRunner.createIndex(
      "ban_appeal_request",
      new TableIndex({
        name: "IDX_ban_appeal_user_id",
        columnNames: ["user_id"],
      })
    );

    await queryRunner.createIndex(
      "ban_appeal_request",
      new TableIndex({
        name: "IDX_ban_appeal_status",
        columnNames: ["status"],
      })
    );

    await queryRunner.createIndex(
      "ban_appeal_request",
      new TableIndex({
        name: "IDX_ban_appeal_cpf",
        columnNames: ["cpf"],
      })
    );

    await queryRunner.createIndex(
      "ban_appeal_request",
      new TableIndex({
        name: "IDX_ban_appeal_submitted_at",
        columnNames: ["submitted_at"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.dropTable("ban_appeal_request");

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS refund_decision_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS pix_key_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS previous_ban_type_enum;`);
  }
}
