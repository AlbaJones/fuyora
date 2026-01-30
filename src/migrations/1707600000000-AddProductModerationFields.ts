import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddProductModerationFields1707600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create product_review_status_enum
    await queryRunner.query(`
      CREATE TYPE product_review_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    `);

    // Add review_status column
    await queryRunner.addColumn(
      "product",
      new TableColumn({
        name: "review_status",
        type: "product_review_status_enum",
        default: "'PENDING'",
      })
    );

    // Add rejection_reason column
    await queryRunner.addColumn(
      "product",
      new TableColumn({
        name: "rejection_reason",
        type: "text",
        isNullable: true,
      })
    );

    // Add reviewed_by column
    await queryRunner.addColumn(
      "product",
      new TableColumn({
        name: "reviewed_by",
        type: "varchar",
        isNullable: true,
      })
    );

    // Add reviewed_at column
    await queryRunner.addColumn(
      "product",
      new TableColumn({
        name: "reviewed_at",
        type: "timestamp with time zone",
        isNullable: true,
      })
    );

    // Create index on review_status for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_product_review_status ON product(review_status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS idx_product_review_status;`);

    // Drop columns
    await queryRunner.dropColumn("product", "reviewed_at");
    await queryRunner.dropColumn("product", "reviewed_by");
    await queryRunner.dropColumn("product", "rejection_reason");
    await queryRunner.dropColumn("product", "review_status");

    // Drop enum
    await queryRunner.query(`DROP TYPE product_review_status_enum;`);
  }
}
