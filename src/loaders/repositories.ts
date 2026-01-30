import { 
  dataSource,
} from "@medusajs/medusa/dist/loaders/database";
import { KycSubmission, AuditLog, Payment, SellerAccount } from "../models";

export default async (container: any): Promise<void> => {
  try {
    const kycSubmissionRepository = dataSource.getRepository(KycSubmission);
    const auditLogRepository = dataSource.getRepository(AuditLog);
    const paymentRepository = dataSource.getRepository(Payment);
    const sellerAccountRepository = dataSource.getRepository(SellerAccount);

    container.register({
      kycSubmissionRepository: {
        resolve: () => kycSubmissionRepository,
      },
      auditLogRepository: {
        resolve: () => auditLogRepository,
      },
      paymentRepository: {
        resolve: () => paymentRepository,
      },
      sellerAccountRepository: {
        resolve: () => sellerAccountRepository,
      },
    });
  } catch (error) {
    console.error("Error loading repositories:", error);
  }
};
