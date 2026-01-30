import { 
  dataSource,
} from "@medusajs/medusa/dist/loaders/database";
import { KycSubmission, AuditLog } from "../models";

export default async (container: any): Promise<void> => {
  try {
    const kycSubmissionRepository = dataSource.getRepository(KycSubmission);
    const auditLogRepository = dataSource.getRepository(AuditLog);

    container.register({
      kycSubmissionRepository: {
        resolve: () => kycSubmissionRepository,
      },
      auditLogRepository: {
        resolve: () => auditLogRepository,
      },
    });
  } catch (error) {
    console.error("Error loading repositories:", error);
  }
};
