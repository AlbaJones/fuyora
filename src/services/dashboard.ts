import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import { KycSubmission, KycStatus, AuditLog } from "../models";

interface DashboardStats {
  total_submissions: number;
  pending_review: number;
  approved: number;
  rejected: number;
  approval_rate: number;
  average_review_time_hours: number;
}

interface KycMetrics {
  submissions_by_status: {
    EM_ANALISE: number;
    APROVADO: number;
    RECUSADO: number;
  };
  submissions_by_level: {
    level_1: number;
    level_2: number;
    level_3: number;
  };
  recent_submissions: number;
  today_submissions: number;
  week_submissions: number;
}

interface RecentActivity {
  id: string;
  user_id: string;
  status: KycStatus;
  submitted_at: Date;
  reviewed_at: Date | null;
  approval_level: number;
}

class DashboardService extends TransactionBaseService {
  protected kycSubmissionRepository_: Repository<KycSubmission>;
  protected auditLogRepository_: Repository<AuditLog>;

  constructor(container: any) {
    super(container);
    this.kycSubmissionRepository_ = container.kycSubmissionRepository;
    this.auditLogRepository_ = container.auditLogRepository;
  }

  async getOverallStats(): Promise<DashboardStats> {
    const total = await this.kycSubmissionRepository_.count();
    
    const pending = await this.kycSubmissionRepository_.count({
      where: { status: KycStatus.EM_ANALISE },
    });

    const approved = await this.kycSubmissionRepository_.count({
      where: { status: KycStatus.APROVADO },
    });

    const rejected = await this.kycSubmissionRepository_.count({
      where: { status: KycStatus.RECUSADO },
    });

    const approvalRate = total > 0 ? (approved / (approved + rejected)) * 100 : 0;

    // Calculate average review time
    const reviewedSubmissions = await this.kycSubmissionRepository_.find({
      where: [
        { status: KycStatus.APROVADO },
        { status: KycStatus.RECUSADO },
      ],
      select: ["submitted_at", "reviewed_at"],
    });

    let totalReviewTime = 0;
    let reviewedCount = 0;

    reviewedSubmissions.forEach((sub) => {
      if (sub.reviewed_at && sub.submitted_at) {
        const diff = sub.reviewed_at.getTime() - sub.submitted_at.getTime();
        totalReviewTime += diff;
        reviewedCount++;
      }
    });

    const averageReviewTimeHours =
      reviewedCount > 0 ? totalReviewTime / reviewedCount / (1000 * 60 * 60) : 0;

    return {
      total_submissions: total,
      pending_review: pending,
      approved,
      rejected,
      approval_rate: Math.round(approvalRate * 100) / 100,
      average_review_time_hours: Math.round(averageReviewTimeHours * 100) / 100,
    };
  }

  async getKycMetrics(): Promise<KycMetrics> {
    const emAnalise = await this.kycSubmissionRepository_.count({
      where: { status: KycStatus.EM_ANALISE },
    });

    const aprovado = await this.kycSubmissionRepository_.count({
      where: { status: KycStatus.APROVADO },
    });

    const recusado = await this.kycSubmissionRepository_.count({
      where: { status: KycStatus.RECUSADO },
    });

    // Count by approval level
    const level1 = await this.kycSubmissionRepository_.count({
      where: { approval_level: 1, status: KycStatus.EM_ANALISE },
    });

    const level2 = await this.kycSubmissionRepository_.count({
      where: { approval_level: 2, status: KycStatus.EM_ANALISE },
    });

    const level3 = await this.kycSubmissionRepository_.count({
      where: { approval_level: 3, status: KycStatus.EM_ANALISE },
    });

    // Recent submissions (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const recent = await this.kycSubmissionRepository_.count({
      where: {
        created_at: {
          $gte: yesterday,
        } as any,
      },
    });

    // Today's submissions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await this.kycSubmissionRepository_.count({
      where: {
        created_at: {
          $gte: today,
        } as any,
      },
    });

    // Week submissions
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekCount = await this.kycSubmissionRepository_.count({
      where: {
        created_at: {
          $gte: weekAgo,
        } as any,
      },
    });

    return {
      submissions_by_status: {
        EM_ANALISE: emAnalise,
        APROVADO: aprovado,
        RECUSADO: recusado,
      },
      submissions_by_level: {
        level_1: level1,
        level_2: level2,
        level_3: level3,
      },
      recent_submissions: recent,
      today_submissions: todayCount,
      week_submissions: weekCount,
    };
  }

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const submissions = await this.kycSubmissionRepository_.find({
      order: { created_at: "DESC" },
      take: limit,
      select: [
        "id",
        "user_id",
        "status",
        "submitted_at",
        "reviewed_at",
        "approval_level",
      ],
    });

    return submissions.map((sub) => ({
      id: sub.id,
      user_id: sub.user_id,
      status: sub.status,
      submitted_at: sub.submitted_at,
      reviewed_at: sub.reviewed_at,
      approval_level: sub.approval_level,
    }));
  }
}

export default DashboardService;
