import { 
  dataSource,
} from "@medusajs/medusa/dist/loaders/database";
import { KycSubmission, AuditLog, Payment, SellerAccount, Product, Order, Review } from "../models";

export default async (container: any): Promise<void> => {
  try {
    const kycSubmissionRepository = dataSource.getRepository(KycSubmission);
    const auditLogRepository = dataSource.getRepository(AuditLog);
    const paymentRepository = dataSource.getRepository(Payment);
    const sellerAccountRepository = dataSource.getRepository(SellerAccount);
    const productRepository = dataSource.getRepository(Product);
    const orderRepository = dataSource.getRepository(Order);
    const reviewRepository = dataSource.getRepository(Review);

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
      productRepository: {
        resolve: () => productRepository,
      },
      orderRepository: {
        resolve: () => orderRepository,
      },
      reviewRepository: {
        resolve: () => reviewRepository,
      },
    });
  } catch (error) {
    console.error("Error loading repositories:", error);
  }
};
