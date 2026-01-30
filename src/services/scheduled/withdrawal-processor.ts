import { TransactionBaseService } from "@medusajs/medusa";
import { Withdrawal, WithdrawalStatus } from "../../models/ledger";
import { AuditAction } from "../../models/audit-log";

/**
 * WithdrawalProcessorService
 * 
 * Scheduled job that runs hourly to:
 * 1. Process withdrawals that have passed their delay period
 * 2. Send withdrawals to payment provider (PagSeguro)
 */
export default class WithdrawalProcessorService extends TransactionBaseService {
  /**
   * Process withdrawals that are ready (past can_process_at)
   * Runs every hour via scheduled job
   */
  async processScheduledWithdrawals(): Promise<void> {
    const manager = this.activeManager_;
    const withdrawalRepo = manager.getRepository(Withdrawal);

    const now = new Date();

    // Find all WAITING_DELAY withdrawals that can now be processed
    const readyWithdrawals = await withdrawalRepo
      .createQueryBuilder("withdrawal")
      .where("withdrawal.status = :status", { status: WithdrawalStatus.WAITING_DELAY })
      .andWhere("withdrawal.can_process_at IS NOT NULL")
      .andWhere("withdrawal.can_process_at <= :now", { now })
      .getMany();

    if (readyWithdrawals.length === 0) {
      console.log("[WithdrawalProcessor] No withdrawals ready to process");
      return;
    }

    console.log(`[WithdrawalProcessor] Found ${readyWithdrawals.length} withdrawals ready to process`);

    const withdrawalService = this.container.resolve("withdrawalService");

    for (const withdrawal of readyWithdrawals) {
      try {
        // Process the withdrawal through payment provider
        await withdrawalService.processWithdrawal(withdrawal.id);

        // Log audit event
        await this.createAuditLog({
          action: AuditAction.WITHDRAWAL_PROCESSED,
          entity_type: "withdrawal",
          entity_id: withdrawal.id,
          payload: {
            amount: withdrawal.amount,
            seller_id: withdrawal.seller_id,
            anticipated: withdrawal.anticipated,
            can_process_at: withdrawal.can_process_at,
          },
        });

        console.log(`[WithdrawalProcessor] Processed withdrawal ${withdrawal.id}`);
      } catch (error) {
        console.error(`[WithdrawalProcessor] Error processing withdrawal ${withdrawal.id}:`, error);
        
        // Mark as failed
        withdrawal.status = WithdrawalStatus.FAILED;
        withdrawal.failure_reason = error.message || "Unknown error during processing";
        await withdrawalRepo.save(withdrawal);
      }
    }

    console.log(`[WithdrawalProcessor] Completed processing ${readyWithdrawals.length} withdrawals`);
  }

  /**
   * Helper to create audit log
   */
  private async createAuditLog(data: {
    action: AuditAction;
    entity_type: string;
    entity_id: string;
    payload: any;
  }): Promise<void> {
    const manager = this.activeManager_;
    const AuditLog = await import("../../models/audit-log").then((m) => m.AuditLog);
    const auditRepo = manager.getRepository(AuditLog);

    const auditLog = auditRepo.create({
      actor_id: "system",
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      payload: data.payload,
    });

    await auditRepo.save(auditLog);
  }
}
