import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import { UnbanRequest, UnbanRequestStatus } from "../models/ban";
import { AuditLog, AuditAction } from "../models/audit-log";

class UnbanRequestService extends TransactionBaseService {
  private unbanRequestRepository: Repository<UnbanRequest>;
  private auditLogRepository: Repository<AuditLog>;

  constructor({ unbanRequestRepository, auditLogRepository }) {
    super(arguments[0]);
    this.unbanRequestRepository = unbanRequestRepository;
    this.auditLogRepository = auditLogRepository;
  }

  /**
   * Create an unban request
   * Can be called even if user is banned (no auth required)
   */
  async createRequest(
    userId: string | null,
    email: string,
    reason: string,
    message: string
  ): Promise<UnbanRequest> {
    const request = this.unbanRequestRepository.create({
      user_id: userId,
      email,
      reason,
      message,
      status: UnbanRequestStatus.PENDING,
    });

    const savedRequest = await this.unbanRequestRepository.save(request);

    // Log the request
    await this.auditLogRepository.save({
      actor_id: userId || "anonymous",
      entity_type: "unban_request",
      entity_id: savedRequest.id,
      action: "UNBAN_REQUEST_CREATED" as AuditAction,
      payload: {
        email,
        reason,
      },
    });

    return savedRequest;
  }

  /**
   * List unban requests (admin)
   */
  async listRequests(
    status?: UnbanRequestStatus,
    page: number = 1,
    perPage: number = 50
  ): Promise<{ requests: UnbanRequest[]; total: number }> {
    const query = this.unbanRequestRepository.createQueryBuilder("request");

    if (status) {
      query.where("request.status = :status", { status });
    }

    query.orderBy("request.submitted_at", "DESC");
    query.skip((page - 1) * perPage);
    query.take(perPage);

    const [requests, total] = await query.getManyAndCount();

    return { requests, total };
  }

  /**
   * Get a specific unban request
   */
  async getRequest(requestId: string): Promise<UnbanRequest> {
    const request = await this.unbanRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Unban request not found");
    }

    return request;
  }

  /**
   * Approve an unban request (admin)
   */
  async approveRequest(
    requestId: string,
    reviewerId: string,
    adminNotes?: string
  ): Promise<UnbanRequest> {
    const request = await this.getRequest(requestId);

    if (request.status !== UnbanRequestStatus.PENDING && 
        request.status !== UnbanRequestStatus.UNDER_REVIEW) {
      throw new Error("Request has already been reviewed");
    }

    request.status = UnbanRequestStatus.APPROVED;
    request.reviewed_by = reviewerId;
    request.reviewed_at = new Date();
    request.admin_notes = adminNotes;

    const updatedRequest = await this.unbanRequestRepository.save(request);

    // Log the approval
    await this.auditLogRepository.save({
      actor_id: reviewerId,
      entity_type: "unban_request",
      entity_id: requestId,
      action: "UNBAN_REQUEST_APPROVED" as AuditAction,
      payload: {
        user_id: request.user_id,
        email: request.email,
        admin_notes: adminNotes,
      },
    });

    return updatedRequest;
  }

  /**
   * Deny an unban request (admin)
   */
  async denyRequest(
    requestId: string,
    reviewerId: string,
    adminNotes?: string
  ): Promise<UnbanRequest> {
    const request = await this.getRequest(requestId);

    if (request.status !== UnbanRequestStatus.PENDING && 
        request.status !== UnbanRequestStatus.UNDER_REVIEW) {
      throw new Error("Request has already been reviewed");
    }

    request.status = UnbanRequestStatus.DENIED;
    request.reviewed_by = reviewerId;
    request.reviewed_at = new Date();
    request.admin_notes = adminNotes;

    const updatedRequest = await this.unbanRequestRepository.save(request);

    // Log the denial
    await this.auditLogRepository.save({
      actor_id: reviewerId,
      entity_type: "unban_request",
      entity_id: requestId,
      action: "UNBAN_REQUEST_DENIED" as AuditAction,
      payload: {
        user_id: request.user_id,
        email: request.email,
        admin_notes: adminNotes,
      },
    });

    return updatedRequest;
  }

  /**
   * Set request to under review
   */
  async setUnderReview(requestId: string, reviewerId: string): Promise<UnbanRequest> {
    const request = await this.getRequest(requestId);

    if (request.status !== UnbanRequestStatus.PENDING) {
      throw new Error("Request is not pending");
    }

    request.status = UnbanRequestStatus.UNDER_REVIEW;
    request.reviewed_by = reviewerId;

    return await this.unbanRequestRepository.save(request);
  }
}

export default UnbanRequestService;
