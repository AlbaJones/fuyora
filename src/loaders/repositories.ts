import { 
  dataSource,
} from "@medusajs/medusa/dist/loaders/database";
import { 
  KycSubmission, 
  AuditLog, 
  Payment, 
  Product, 
  Order, 
  Review,
  SellerBalance,
  Transaction,
  Withdrawal,
  Dispute,
} from "../models";

export default async (container: any): Promise<void> => {
  try {
    const kycSubmissionRepository = dataSource.getRepository(KycSubmission);
    const auditLogRepository = dataSource.getRepository(AuditLog);
    const paymentRepository = dataSource.getRepository(Payment);
    const productRepository = dataSource.getRepository(Product);
    const orderRepository = dataSource.getRepository(Order);
    const reviewRepository = dataSource.getRepository(Review);
    const sellerBalanceRepository = dataSource.getRepository(SellerBalance);
    const transactionRepository = dataSource.getRepository(Transaction);
    const withdrawalRepository = dataSource.getRepository(Withdrawal);
    const disputeRepository = dataSource.getRepository(Dispute);

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
      productRepository: {
        resolve: () => productRepository,
      },
      orderRepository: {
        resolve: () => orderRepository,
      },
      reviewRepository: {
        resolve: () => reviewRepository,
      },
      sellerBalanceRepository: {
        resolve: () => sellerBalanceRepository,
      },
      transactionRepository: {
        resolve: () => transactionRepository,
      },
      withdrawalRepository: {
        resolve: () => withdrawalRepository,
      },
      disputeRepository: {
        resolve: () => disputeRepository,
      },
    });
  } catch (error) {
    console.error("Error loading repositories:", error);
  }
};
