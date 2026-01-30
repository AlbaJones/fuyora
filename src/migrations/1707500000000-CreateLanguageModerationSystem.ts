import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateLanguageModerationSystem1707500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE violation_severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');
    `);

    await queryRunner.query(`
      CREATE TYPE violation_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');
    `);

    await queryRunner.query(`
      CREATE TYPE violation_action_enum AS ENUM ('WARNING', 'BAN_24H', 'BAN_72H', 'BAN_7D', 'BAN_PERMANENT');
    `);

    // Create language_violation table
    await queryRunner.createTable(
      new Table({
        name: "language_violation",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()"
          },
          {
            name: "user_id",
            type: "varchar",
            isNullable: false
          },
          {
            name: "content",
            type: "text",
            isNullable: false
          },
          {
            name: "detected_words",
            type: "text",
            isNullable: false,
            comment: "Comma-separated list of detected words"
          },
          {
            name: "severity",
            type: "violation_severity_enum",
            default: "'LOW'"
          },
          {
            name: "status",
            type: "violation_status_enum",
            default: "'PENDING'"
          },
          {
            name: "action_taken",
            type: "violation_action_enum",
            isNullable: true
          },
          {
            name: "reviewed_by",
            type: "varchar",
            isNullable: true
          },
          {
            name: "reviewed_at",
            type: "timestamp",
            isNullable: true
          },
          {
            name: "appeal_submitted",
            type: "boolean",
            default: false
          },
          {
            name: "appeal_message",
            type: "text",
            isNullable: true
          },
          {
            name: "appeal_reviewed_at",
            type: "timestamp",
            isNullable: true
          },
          {
            name: "ban_id",
            type: "uuid",
            isNullable: true
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()"
          }
        ]
      }),
      true
    );

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_language_violation_user_id ON language_violation(user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_language_violation_status ON language_violation(status);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_language_violation_severity ON language_violation(severity);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_language_violation_created_at ON language_violation(created_at);
    `);

    // Add foreign key to user table
    await queryRunner.createForeignKey(
      "language_violation",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "user",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE"
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.dropTable("language_violation");

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS violation_action_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS violation_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS violation_severity_enum;`);
  }
}
