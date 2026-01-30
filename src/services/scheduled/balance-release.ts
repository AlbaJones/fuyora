import { EntityManager } from "typeorm";
import { LedgerService } from "../ledger";
import { Transaction, TransactionType, TransactionStatus } from "../../models/ledger";

/**
 * Scheduled job to auto-release funds after holding period
 * Runs periodically to check for transactions that are ready to be released
 */

/**
 * Get balance release hours from environment (default 72 hours)
 */
function getBalanceReleaseHours(): number {
  const hoursEnv = process.env.BALANCE_RELEASE_HOURS;
  if (!hoursEnv) {
    return 72;
  }
  const hours = parseInt(hoursEnv, 10);
  return isNaN(hours) || hours < 0 ? 72 : hours;
}

/**
 * Calculate the release timestamp based on created_at and release hours
 */
function calculateReleaseTime(createdAt: Date, releaseHours: number): Date {
  const releaseTime = new Date(createdAt);
  releaseTime.setHours(releaseTime.getHours() + releaseHours);
  return releaseTime;
}

/**
 * Release scheduled funds
 * Finds SALE transactions that are pending and past their release time,
 * then makes them available for withdrawal
 * 
 * @param manager - TypeORM EntityManager instance
 */
export async function releaseScheduledFunds(
  manager: EntityManager
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ transactionId: string; error: string }>;
}> {
  const ledgerService = new LedgerService(manager);
  const releaseHours = getBalanceReleaseHours();
  
  let processed = 0;
  let failed = 0;
  const errors: Array<{ transactionId: string; error: string }> = [];

  try {
    console.log(
      `[Balance Release] Starting scheduled funds release (${releaseHours}h holding period)`
    );

    // Find SALE transactions that are in PENDING status
    // The pending_release_at timestamp can be stored in transaction.metadata.pending_release_at
    // If not present, it's calculated from created_at + BALANCE_RELEASE_HOURS
    const pendingTransactions = await manager
      .createQueryBuilder(Transaction, "transaction")
      .where("transaction.type = :type", { type: TransactionType.SALE })
      .andWhere("transaction.status = :status", {
        status: TransactionStatus.PENDING,
      })
      .getMany();

    console.log(
      `[Balance Release] Found ${pendingTransactions.length} pending SALE transactions`
    );

    const now = new Date();

    for (const transaction of pendingTransactions) {
      try {
        // Check if pending_release_at exists in metadata or calculate from created_at
        const pendingReleaseAt =
          transaction.metadata?.pending_release_at
            ? new Date(transaction.metadata.pending_release_at)
            : calculateReleaseTime(transaction.created_at, releaseHours);

        // Skip if not yet ready for release
        if (pendingReleaseAt > now) {
          continue;
        }

        console.log(
          `[Balance Release] Processing transaction ${transaction.id} for seller ${transaction.seller_id}`
        );

        // Use a database transaction to ensure atomicity
        await manager.transaction(async (transactionManager) => {
          const transactionLedgerService = new LedgerService(transactionManager);
          
          // Make the sale available
          await transactionLedgerService.makeSaleAvailable(
            transaction.seller_id,
            Number(transaction.amount),
            transaction.reference_id || transaction.id
          );

          // Update transaction status to COMPLETED
          transaction.status = TransactionStatus.COMPLETED;
          await transactionManager.save(transaction);
        });

        processed++;
        console.log(
          `[Balance Release] Successfully released funds for transaction ${transaction.id}`
        );
      } catch (error) {
        failed++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push({
          transactionId: transaction.id,
          error: errorMessage,
        });
        console.error(
          `[Balance Release] Failed to process transaction ${transaction.id}:`,
          errorMessage
        );
      }
    }

    console.log(
      `[Balance Release] Completed: ${processed} processed, ${failed} failed`
    );

    return { processed, failed, errors };
  } catch (error) {
    console.error("[Balance Release] Critical error during fund release:", error);
    throw error;
  }
}

/**
 * Schedule the balance release job
 * This function can be called by a cron job or task scheduler
 * 
 * @param manager - TypeORM EntityManager instance
 */
export async function scheduleBalanceRelease(
  manager: EntityManager
): Promise<void> {
  try {
    await releaseScheduledFunds(manager);
  } catch (error) {
    console.error("[Balance Release Scheduler] Job failed:", error);
    // Don't throw - let the scheduler continue
  }
}
