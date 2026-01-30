import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateKycAndAuditTables1706619600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create kyc_status_enum
    await queryRunner.query(`
      CREATE TYPE "kyc_status_enum" AS ENUM (
        'EM_ANALISE',
        'APROVADO',
        'RECUSADO'
      );
    `);

    // Create audit_action_enum
    await queryRunner.query(`
      CREATE TYPE "audit_action_enum" AS ENUM (
        'KYC_SUBMIT',
        'KYC_REVIEW_APPROVE',
        'KYC_REVIEW_REJECT',
        'USER_STATUS_CHANGE'
      );
    `);

    // Create kyc_submission table
    await queryRunner.createTable(
      new Table({
        name: "kyc_submission",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "user_id",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "status",
            type: "kyc_status_enum",
            default: "'EM_ANALISE'",
            isNullable: false,
          },
          {
            name: "rejection_reason",
            type: "text",
            isNullable: true,
          },
          {
            name: "personal_data",
            type: "jsonb",
            isNullable: false,
          },
          {
            name: "documents",
            type: "jsonb",
            isNullable: false,
          },
          {
            name: "submitted_at",
            type: "timestamp with time zone",
            isNullable: false,
          },
          {
            name: "reviewed_at",
            type: "timestamp with time zone",
            isNullable: true,
          },
          {
            name: "reviewer_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp with time zone",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create index on user_id
    await queryRunner.createIndex(
      "kyc_submission",
      new TableIndex({
        name: "IDX_kyc_submission_user_id",
        columnNames: ["user_id"],
      })
    );

    // Create audit_log table
    await queryRunner.createTable(
      new Table({
        name: "audit_log",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "actor_id",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "entity_type",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "entity_id",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "action",
            type: "audit_action_enum",
            isNullable: false,
          },
          {
            name: "payload",
            type: "jsonb",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp with time zone",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes on audit_log
    await queryRunner.createIndex(
      "audit_log",
      new TableIndex({
        name: "IDX_audit_log_actor_id",
        columnNames: ["actor_id"],
      })
    );

    await queryRunner.createIndex(
      "audit_log",
      new TableIndex({
        name: "IDX_audit_log_entity_type",
        columnNames: ["entity_type"],
      })
    );

    await queryRunner.createIndex(
      "audit_log",
      new TableIndex({
        name: "IDX_audit_log_entity_id",
        columnNames: ["entity_id"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex("audit_log", "IDX_audit_log_entity_id");
    await queryRunner.dropIndex("audit_log", "IDX_audit_log_entity_type");
    await queryRunner.dropIndex("audit_log", "IDX_audit_log_actor_id");
    await queryRunner.dropIndex("kyc_submission", "IDX_kyc_submission_user_id");

    // Drop tables
    await queryRunner.dropTable("audit_log");
    await queryRunner.dropTable("kyc_submission");

    // Drop enums
    await queryRunner.query(`DROP TYPE "audit_action_enum";`);
    await queryRunner.query(`DROP TYPE "kyc_status_enum";`);
  }
}
