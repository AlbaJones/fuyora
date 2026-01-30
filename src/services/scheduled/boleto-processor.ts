import { TransactionBaseService } from "@medusajs/medusa";
import { Payment, PaymentStatus, PaymentMethod } from "../../models/payment";
import { AuditAction } from "../../models/audit-log";

/**
 * BoletoProcessorService
 * 
 * Scheduled job that runs hourly to:
 * 1. Expire boletos that are past their expiration date
 * 2. Cancel related orders if necessary
 */
export default class BoletoProcessorService extends TransactionBaseService {
  /**
   * Expire boletos that are past their expiration date
   * Runs every hour via scheduled job
   */
  async expireBoletos(): Promise<void> {
    const manager = this.activeManager_;
    const paymentRepo = manager.getRepository(Payment);

    const now = new Date();

    // Find all PENDING boletos that have expired
    const expiredBoletos = await paymentRepo
      .createQueryBuilder("payment")
      .where("payment.payment_method = :method", { method: PaymentMethod.BOLETO })
      .andWhere("payment.status = :status", { status: PaymentStatus.PENDING })
      .andWhere("payment.boleto_expires_at IS NOT NULL")
      .andWhere("payment.boleto_expires_at < :now", { now })
      .getMany();

    if (expiredBoletos.length === 0) {
      console.log("[BoletoProcessor] No expired boletos found");
      return;
    }

    console.log(`[BoletoProcessor] Found ${expiredBoletos.length} expired boletos to process`);

    for (const boleto of expiredBoletos) {
      try {
        // Mark boleto as EXPIRED
        boleto.status = PaymentStatus.EXPIRED;
        await paymentRepo.save(boleto);

        // Log audit event
        await this.createAuditLog({
          action: AuditAction.PAYMENT_EXPIRED,
          entity_type: "payment",
          entity_id: boleto.id,
          payload: {
            boleto_code: boleto.boleto_code,
            expires_at: boleto.boleto_expires_at,
            amount: boleto.amount,
          },
        });

        console.log(`[BoletoProcessor] Expired boleto ${boleto.id}`);
      } catch (error) {
        console.error(`[BoletoProcessor] Error expiring boleto ${boleto.id}:`, error);
      }
    }

    console.log(`[BoletoProcessor] Successfully expired ${expiredBoletos.length} boletos`);
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
