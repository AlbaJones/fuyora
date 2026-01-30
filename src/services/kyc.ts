import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import { KycSubmission, KycStatus, AuditLog, AuditAction } from "../models";

interface SubmitKycPayload {
  full_name: string;
  cpf: string;
  address: {
    line: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  documents: {
    doc_url: string;
    selfie_url: string;
    proof_url: string;
  };
}

class KycService extends TransactionBaseService {
  protected kycSubmissionRepository_: Repository<KycSubmission>;
  protected auditLogRepository_: Repository<AuditLog>;
  protected eventBusService_: any;
  protected userService_: any;

  constructor(container: any) {
    super(container);
    this.kycSubmissionRepository_ = container.kycSubmissionRepository;
    this.auditLogRepository_ = container.auditLogRepository;

    try {
      this.eventBusService_ = container.eventBusService;
    } catch (e) {
      // EventBusService is optional
    }

    try {
      this.userService_ = container.userService;
    } catch (e) {
      // UserService is optional for now
    }
  }

  async submitKyc(userId: string, payload: SubmitKycPayload): Promise<KycSubmission> {
    return await this.atomicPhase_(async (manager) => {
      const kycRepo = manager.getRepository(KycSubmission);
      const auditRepo = manager.getRepository(AuditLog);

      // Validate required documents
      const { documents } = payload;
      if (!documents.doc_url || !documents.selfie_url || !documents.proof_url) {
        throw new Error("All documents are required: doc_url, selfie_url, proof_url");
      }

      // Check for duplicate EM_ANALISE submission
      const existingSubmission = await kycRepo.findOne({
        where: {
          user_id: userId,
          status: KycStatus.EM_ANALISE,
        },
      });

      if (existingSubmission) {
        throw new Error("A KYC submission is already in analysis for this user");
      }

      // Create submission
      const submission = kycRepo.create({
        user_id: userId,
        status: KycStatus.EM_ANALISE,
        personal_data: {
          full_name: payload.full_name,
          cpf: payload.cpf,
          address: payload.address,
        },
        documents: payload.documents,
        submitted_at: new Date(),
      });

      const savedSubmission = await kycRepo.save(submission);

      // Log audit
      const auditLog = auditRepo.create({
        actor_id: userId,
        entity_type: "kyc_submission",
        entity_id: savedSubmission.id,
        action: AuditAction.KYC_SUBMIT,
        payload: {
          full_name: payload.full_name,
          cpf: payload.cpf,
          address: payload.address,
          documents: payload.documents,
        },
      });

      await auditRepo.save(auditLog);

      // TODO: Update user status when userService is available
      // TODO: Emit event 'user.kyc_submitted' when eventBusService is configured

      return savedSubmission;
    });
  }

  async getMine(userId: string): Promise<KycSubmission | null> {
    return await this.kycSubmissionRepository_.findOne({
      where: { user_id: userId },
      order: { created_at: "DESC" },
    });
  }
}

export default KycService;
