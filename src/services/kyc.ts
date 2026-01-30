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

  async getSubmissions(
    status?: KycStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ submissions: KycSubmission[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const whereClause = status ? { status } : {};
    
    const [submissions, total] = await this.kycSubmissionRepository_.findAndCount({
      where: whereClause,
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { submissions, total };
  }

  async getSubmissionById(submissionId: string): Promise<KycSubmission | null> {
    return await this.kycSubmissionRepository_.findOne({
      where: { id: submissionId },
    });
  }

  async approveKyc(
    submissionId: string,
    reviewerId: string
  ): Promise<KycSubmission> {
    return await this.atomicPhase_(async (manager) => {
      const kycRepo = manager.getRepository(KycSubmission);
      const auditRepo = manager.getRepository(AuditLog);

      // Get the submission
      const submission = await kycRepo.findOne({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error("KYC submission not found");
      }

      // Check if already reviewed
      if (submission.status !== KycStatus.EM_ANALISE) {
        throw new Error(
          `KYC submission already reviewed with status: ${submission.status}`
        );
      }

      // Update submission
      submission.status = KycStatus.APROVADO;
      submission.reviewed_at = new Date();
      submission.reviewer_id = reviewerId;
      submission.rejection_reason = null;

      const updatedSubmission = await kycRepo.save(submission);

      // Log audit
      const auditLog = auditRepo.create({
        actor_id: reviewerId,
        entity_type: "kyc_submission",
        entity_id: submissionId,
        action: AuditAction.KYC_REVIEW_APPROVE,
        payload: {
          user_id: submission.user_id,
          reviewer_id: reviewerId,
        },
      });

      await auditRepo.save(auditLog);

      // Update user status (if userService is available)
      if (this.userService_) {
        try {
          await this.userService_.update(submission.user_id, {
            metadata: { kyc_status: "APROVADO", kyc_approved_at: new Date() },
          });
          
          // Log user status change
          const userAuditLog = auditRepo.create({
            actor_id: reviewerId,
            entity_type: "user",
            entity_id: submission.user_id,
            action: AuditAction.USER_STATUS_CHANGE,
            payload: {
              kyc_status: "APROVADO",
              kyc_submission_id: submissionId,
            },
          });
          await auditRepo.save(userAuditLog);
        } catch (e) {
          console.error("Failed to update user status:", e);
        }
      }

      // Emit event
      if (this.eventBusService_) {
        try {
          await this.eventBusService_.emit("user.kyc_approved", {
            user_id: submission.user_id,
            submission_id: submissionId,
            reviewer_id: reviewerId,
          });
        } catch (e) {
          console.error("Failed to emit kyc_approved event:", e);
        }
      }

      return updatedSubmission;
    });
  }

  async rejectKyc(
    submissionId: string,
    reviewerId: string,
    rejectionReason: string
  ): Promise<KycSubmission> {
    return await this.atomicPhase_(async (manager) => {
      const kycRepo = manager.getRepository(KycSubmission);
      const auditRepo = manager.getRepository(AuditLog);

      // Validate rejection reason
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new Error("Rejection reason is required");
      }

      // Get the submission
      const submission = await kycRepo.findOne({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error("KYC submission not found");
      }

      // Check if already reviewed
      if (submission.status !== KycStatus.EM_ANALISE) {
        throw new Error(
          `KYC submission already reviewed with status: ${submission.status}`
        );
      }

      // Update submission
      submission.status = KycStatus.RECUSADO;
      submission.reviewed_at = new Date();
      submission.reviewer_id = reviewerId;
      submission.rejection_reason = rejectionReason;

      const updatedSubmission = await kycRepo.save(submission);

      // Log audit
      const auditLog = auditRepo.create({
        actor_id: reviewerId,
        entity_type: "kyc_submission",
        entity_id: submissionId,
        action: AuditAction.KYC_REVIEW_REJECT,
        payload: {
          user_id: submission.user_id,
          reviewer_id: reviewerId,
          rejection_reason: rejectionReason,
        },
      });

      await auditRepo.save(auditLog);

      // Update user status (if userService is available)
      if (this.userService_) {
        try {
          await this.userService_.update(submission.user_id, {
            metadata: { kyc_status: "RECUSADO", kyc_rejected_at: new Date() },
          });

          // Log user status change
          const userAuditLog = auditRepo.create({
            actor_id: reviewerId,
            entity_type: "user",
            entity_id: submission.user_id,
            action: AuditAction.USER_STATUS_CHANGE,
            payload: {
              kyc_status: "RECUSADO",
              kyc_submission_id: submissionId,
              rejection_reason: rejectionReason,
            },
          });
          await auditRepo.save(userAuditLog);
        } catch (e) {
          console.error("Failed to update user status:", e);
        }
      }

      // Emit event
      if (this.eventBusService_) {
        try {
          await this.eventBusService_.emit("user.kyc_rejected", {
            user_id: submission.user_id,
            submission_id: submissionId,
            reviewer_id: reviewerId,
            rejection_reason: rejectionReason,
          });
        } catch (e) {
          console.error("Failed to emit kyc_rejected event:", e);
        }
      }

      return updatedSubmission;
    });
  }
}

export default KycService;
