import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateBanSystem1707100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ban_type_enum
    await queryRunner.query(`
      CREATE TYPE ban_type_enum AS ENUM ('ACCOUNT', 'IP', 'BOTH');
    `);

    // Create ban_duration_enum
    await queryRunner.query(`
      CREATE TYPE ban_duration_enum AS ENUM ('TEMPORARY', 'PERMANENT');
    `);

    // Create unban_request_status_enum
    await queryRunner.query(`
      CREATE TYPE unban_request_status_enum AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'DENIED');
    `);

    // Create ban table
    await queryRunner.createTable(
      new Table({
        name: "ban",
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
            isNullable: true,
          },
          {
            name: "ip_address",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "type",
            type: "ban_type_enum",
          },
          {
            name: "duration",
            type: "ban_duration_enum",
          },
          {
            name: "reason",
            type: "text",
          },
          {
            name: "banned_by",
            type: "varchar",
          },
          {
            name: "banned_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
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
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create indexes for ban table
    await queryRunner.createIndex(
      "ban",
      new TableIndex({
        name: "IDX_BAN_USER_ACTIVE",
        columnNames: ["user_id", "is_active"],
      })
    );

    await queryRunner.createIndex(
      "ban",
      new TableIndex({
        name: "IDX_BAN_IP_ACTIVE",
        columnNames: ["ip_address", "is_active"],
      })
    );

    // Create unban_request table
    await queryRunner.createTable(
      new Table({
        name: "unban_request",
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
            isNullable: true,
          },
          {
            name: "email",
            type: "varchar",
          },
          {
            name: "reason",
            type: "text",
          },
          {
            name: "message",
            type: "text",
          },
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
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create indexes for unban_request table
    await queryRunner.createIndex(
      "unban_request",
      new TableIndex({
        name: "IDX_UNBAN_REQUEST_USER",
        columnNames: ["user_id"],
      })
    );

    await queryRunner.createIndex(
      "unban_request",
      new TableIndex({
        name: "IDX_UNBAN_REQUEST_STATUS",
        columnNames: ["status"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex("unban_request", "IDX_UNBAN_REQUEST_STATUS");
    await queryRunner.dropIndex("unban_request", "IDX_UNBAN_REQUEST_USER");
    await queryRunner.dropIndex("ban", "IDX_BAN_IP_ACTIVE");
    await queryRunner.dropIndex("ban", "IDX_BAN_USER_ACTIVE");

    // Drop tables
    await queryRunner.dropTable("unban_request");
    await queryRunner.dropTable("ban");

    // Drop enums
    await queryRunner.query(`DROP TYPE unban_request_status_enum;`);
    await queryRunner.query(`DROP TYPE ban_duration_enum;`);
    await queryRunner.query(`DROP TYPE ban_type_enum;`);
  }
}
