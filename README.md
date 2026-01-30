# Fuyora Backend - Complete Marketplace Platform (Sprints 1-4)

MedusaJS-based C2C marketplace backend with complete KYC workflow, multi-level approval, admin dashboard, and Stripe payment integration.

## Features

### Sprint 1 - Foundation
- **KYC Submission**: Submit KYC documents with personal data
- **Presigned S3 URLs**: Generate secure upload URLs for avatars and KYC documents
- **Audit Logging**: Track KYC submissions and user status changes
- **Authentication**: JWT-based authentication middleware

### Sprint 2 - Admin Workflow
- **KYC Approval/Rejection**: Admin endpoints to review and process KYC submissions
- **Pagination & Filtering**: List submissions with status filters
- **Event System**: Emit events on approval/rejection
- **Enhanced Audit**: Complete audit trail for all admin actions

### Sprint 3 - Security & Validation
- **Rate Limiting**: Protect all endpoints from abuse (CodeQL alerts resolved)
- **CPF Validation**: Brazilian tax ID validation with checksum algorithm
- **Email Notifications**: Automated emails for approval/rejection (Portuguese)
- **Event Subscribers**: Auto-send emails on KYC events

### Sprint 4 - Dashboard, Multi-Level & Payments
- **Admin Dashboard**: Real-time statistics and KYC metrics
- **Multi-Level Approval**: 3-level escalation workflow for complex cases
- **Stripe Integration**: Payment processing with platform fees (10%)
- **Document Viewer**: Manual document review (NO AI/OCR)

## Setup

### Prerequisites

- Node.js >= 16
- PostgreSQL
- Redis
- S3-compatible storage (AWS S3, MinIO, etc.)
- Stripe account (for payments)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
DATABASE_URL=postgres://localhost/fuyora_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=fuyora-uploads
AWS_S3_ENDPOINT=https://s3.amazonaws.com
PRESIGN_TTL_SECONDS=900
MAX_UPLOAD_BYTES=10000000
```

5. Build the project:
```bash
npm run build
```

6. Run migrations:
```bash
npm run migration:run
```

7. Start the server:
```bash
npm run dev
```

## API Endpoints

### Storage

#### POST /storage/presign
Generate presigned URL for file upload.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "type": "avatar|kyc_doc|kyc_selfie|kyc_proof",
  "content_type": "image/jpeg|image/png|application/pdf",
  "content_length": 1024000
}
```

**Response**:
```json
{
  "upload_url": "https://s3.amazonaws.com/bucket/key?...",
  "url": "https://s3.amazonaws.com/bucket/key",
  "expires_in": 900
}
```

### KYC

#### POST /kyc/submissions
Submit KYC documents.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "full_name": "John Doe",
  "cpf": "123.456.789-00",
  "address": {
    "line": "123 Main St",
    "city": "São Paulo",
    "state": "SP",
    "zip": "01234-567",
    "country": "BR"
  },
  "documents": {
    "doc_url": "https://s3.amazonaws.com/bucket/doc.pdf",
    "selfie_url": "https://s3.amazonaws.com/bucket/selfie.jpg",
    "proof_url": "https://s3.amazonaws.com/bucket/proof.pdf"
  }
}
```

**Response**:
```json
{
  "id": "uuid",
  "status": "EM_ANALISE"
}
```

#### GET /kyc/submissions/me
Get current user's KYC status.

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "current_status": "EM_ANALISE",
  "submission": {
    "id": "uuid",
    "status": "EM_ANALISE",
    "rejection_reason": null,
    "submitted_at": "2024-01-30T12:00:00Z",
    "reviewed_at": null,
    "documents": {
      "doc_url": "...",
      "selfie_url": "...",
      "proof_url": "..."
    }
  }
}
```

### Admin KYC Management

#### GET /admin/kyc/submissions
List all KYC submissions with optional filtering.

**Authentication**: Required (Bearer token with admin role)

**Query Parameters**:
- `status` (optional): Filter by status (EM_ANALISE, APROVADO, RECUSADO)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Response**:
```json
{
  "submissions": [
    {
      "id": "uuid",
      "user_id": "user-uuid",
      "status": "EM_ANALISE",
      "personal_data": {
        "full_name": "John Doe",
        "cpf": "123.456.789-00",
        "address": { ... }
      },
      "documents": { ... },
      "submitted_at": "2024-01-30T12:00:00Z",
      "reviewed_at": null,
      "reviewer_id": null,
      "rejection_reason": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### GET /admin/kyc/submissions/:id
Get specific KYC submission details.

**Authentication**: Required (Bearer token with admin role)

**Response**:
```json
{
  "id": "uuid",
  "user_id": "user-uuid",
  "status": "EM_ANALISE",
  "personal_data": { ... },
  "documents": { ... },
  "submitted_at": "2024-01-30T12:00:00Z",
  "reviewed_at": null,
  "reviewer_id": null,
  "rejection_reason": null,
  "created_at": "2024-01-30T12:00:00Z",
  "updated_at": "2024-01-30T12:00:00Z"
}
```

#### POST /admin/kyc/submissions/:id/approve
Approve a KYC submission.

**Authentication**: Required (Bearer token with admin role)

**Response**:
```json
{
  "id": "uuid",
  "status": "APROVADO",
  "reviewed_at": "2024-01-30T14:00:00Z",
  "reviewer_id": "admin-uuid",
  "message": "KYC submission approved successfully"
}
```

#### POST /admin/kyc/submissions/:id/reject
Reject a KYC submission with reason.

**Authentication**: Required (Bearer token with admin role)

**Request Body**:
```json
{
  "rejection_reason": "Documents are not clear enough"
}
```

**Response**:
```json
{
  "id": "uuid",
  "status": "RECUSADO",
  "reviewed_at": "2024-01-30T14:00:00Z",
  "reviewer_id": "admin-uuid",
  "rejection_reason": "Documents are not clear enough",
  "message": "KYC submission rejected successfully"
}
```

### Admin Dashboard

#### GET /admin/dashboard/stats
Get overall platform statistics.

**Authentication**: Required (****** with admin role)

**Response**:
```json
{
  "total_submissions": 1250,
  "pending_review": 45,
  "approved": 1100,
  "rejected": 105,
  "approval_rate": 91.29,
  "average_review_time_hours": 2.5
}
```

#### GET /admin/dashboard/kyc-metrics
Get detailed KYC metrics by status and level.

**Authentication**: Required (****** with admin role)

**Response**:
```json
{
  "submissions_by_status": {
    "EM_ANALISE": 45,
    "APROVADO": 1100,
    "RECUSADO": 105
  },
  "submissions_by_level": {
    "level_1": 30,
    "level_2": 12,
    "level_3": 3
  },
  "recent_submissions": 15,
  "today_submissions": 8,
  "week_submissions": 67
}
```

#### GET /admin/dashboard/recent-activity
Get recent submissions.

**Authentication**: Required (****** with admin role)

**Query Parameters**:
- `limit` (optional): Number of results (default: 10, max: 100)

#### GET /admin/kyc/submissions/:id/documents
Get document URLs for manual viewing.

**Authentication**: Required (****** with admin role)

**Response**:
```json
{
  "submission_id": "uuid",
  "user_id": "user-uuid",
  "documents": {
    "doc_url": "https://s3.../doc.pdf",
    "selfie_url": "https://s3.../selfie.jpg",
    "proof_url": "https://s3.../proof.pdf"
  },
  "personal_data": { ... },
  "note": "Documents must be manually reviewed by admin. No automated verification is performed."
}
```

**⚠️ IMPORTANT**: This endpoint returns URLs for **manual human review only**. No AI, OCR, or automated verification is performed.

### Multi-Level Approval Workflow

#### GET /admin/kyc/level/:level/submissions
List submissions at specific approval level (1, 2, or 3).

**Authentication**: Required (****** with admin role)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

#### POST /admin/kyc/submissions/:id/approve-level
Approve submission at current level.

**Authentication**: Required (****** with admin role)

**Request Body**:
```json
{
  "final_approval": true
}
```

- If `final_approval=true`: Final approval, sets status to APROVADO
- If `final_approval=false`: Approve current level only

#### POST /admin/kyc/submissions/:id/escalate
Escalate submission to next approval level.

**Authentication**: Required (****** with admin role)

**Request Body**:
```json
{
  "reason": "Requires senior review due to document complexity"
}
```

Maximum level: 3. Returns error if already at level 3.

#### POST /admin/kyc/submissions/:id/reject-level
Reject submission at any level.

**Authentication**: Required (****** with admin role)

**Request Body**:
```json
{
  "rejection_reason": "Documents are not clear enough"
}
```

### Stripe Payments

#### POST /seller/stripe-account
Create Stripe Connect account for seller.

**Authentication**: Required (******

**Request Body**:
```json
{
  "email": "seller@example.com",
  "country": "BR"
}
```

**Response**:
```json
{
  "account_id": "acct_...",
  "onboarding_url": "https://connect.stripe.com/...",
  "message": "Stripe account created. Complete onboarding to start selling."
}
```

#### GET /seller/stripe-account
Get seller's Stripe account status.

**Authentication**: Required (******

#### POST /payments/create-intent
Create payment intent for purchase.

**Authentication**: Required (******

**Request Body**:
```json
{
  "amount": 10000,
  "currency": "brl",
  "seller_id": "user-123",
  "metadata": {
    "product_id": "prod-456"
  }
}
```

Amount in cents (10000 = R$ 100.00). Platform fee is automatically calculated.

#### POST /webhooks/stripe
Stripe webhook endpoint (signature verification required).

## Rate Limiting

All endpoints are protected with rate limiting to prevent abuse:

| Endpoint Type | Limit | Window | Notes |
|--------------|-------|--------|-------|
| KYC Submission | 5 requests | 1 hour | Prevents spam submissions |
| Presigned URLs | 20 requests | 1 hour | Prevents storage exhaustion |
| Authenticated | 50 requests | 15 min | General auth endpoints |
| Admin | 100 requests | 15 min | Admin review operations |
| General | 100 requests | 15 min | Public endpoints |

Rate limit info is returned in `RateLimit-*` headers.

## CPF Validation

KYC submissions automatically validate Brazilian CPF (tax ID):
- ✅ Format: `###.###.###-##` or 11 digits
- ✅ Check digit validation (both digits)
- ✅ Rejects invalid patterns (all same digits)
- ✅ Auto-formats CPF for storage
- ❌ Returns clear error messages on validation failure

## Email Notifications

When configured, the system sends emails (in Portuguese) for:
- ✅ **KYC Approved**: Confirmation email with approval date
- ✅ **KYC Rejected**: Email with rejection reason and resubmit instructions

Configure SMTP in environment variables (optional - system works without email).

## Database Schema

### kyc_submission
- `id`: UUID (primary key)
- `user_id`: VARCHAR (foreign key to user)
- `status`: ENUM (EM_ANALISE, APROVADO, RECUSADO)
- `rejection_reason`: TEXT (nullable)
- `personal_data`: JSONB (full_name, cpf, address)
- `documents`: JSONB (doc_url, selfie_url, proof_url)
- `submitted_at`: TIMESTAMP
- `reviewed_at`: TIMESTAMP (nullable)
- `reviewer_id`: VARCHAR (nullable)
- **`approval_level`**: INTEGER (default: 1) - Sprint 4
- **`approval_history`**: JSONB (nullable) - Sprint 4
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### audit_log
- `id`: UUID (primary key)
- `actor_id`: VARCHAR
- `entity_type`: VARCHAR
- `entity_id`: VARCHAR
- `action`: ENUM (KYC_SUBMIT, KYC_REVIEW_APPROVE, KYC_REVIEW_REJECT, USER_STATUS_CHANGE)
- `payload`: JSONB
- `created_at`: TIMESTAMP

### payment (Sprint 4)
- `id`: UUID (primary key)
- `buyer_id`: VARCHAR
- `seller_id`: VARCHAR
- `amount`: DECIMAL(10,2)
- `platform_fee`: DECIMAL(10,2)
- `seller_amount`: DECIMAL(10,2)
- `currency`: VARCHAR
- `status`: ENUM (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
- `stripe_payment_intent_id`: VARCHAR (nullable)
- `stripe_charge_id`: VARCHAR (nullable)
- `metadata`: JSONB (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### seller_account (Sprint 4)
- `id`: UUID (primary key)
- `user_id`: VARCHAR (unique)
- `stripe_account_id`: VARCHAR (unique)
- `status`: ENUM (PENDING, ACTIVE, RESTRICTED, DISABLED)
- `charges_enabled`: BOOLEAN
- `payouts_enabled`: BOOLEAN
- `requirements`: JSONB (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://localhost/fuyora_db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT signing | `supersecret` |
| `AWS_ACCESS_KEY_ID` | AWS access key | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `fuyora-uploads` |
| `AWS_S3_ENDPOINT` | S3 endpoint (for compatible services) | - |
| `AWS_S3_FORCE_PATH_STYLE` | Force path-style URLs | `true` |
| `PRESIGN_TTL_SECONDS` | Presigned URL expiration time | `900` |
| `MAX_UPLOAD_BYTES` | Maximum upload size | `10000000` (10MB) |
| `SMTP_HOST` | SMTP server hostname (optional) | - |
| `SMTP_PORT` | SMTP server port (optional) | `587` |
| `SMTP_SECURE` | Use TLS (optional) | `false` |
| `SMTP_USER` | SMTP username (optional) | - |
| `SMTP_PASS` | SMTP password (optional) | - |
| `SMTP_FROM` | From email address (optional) | `noreply@fuyora.com` |

**Note**: Email configuration is optional. If not set, the system logs would-send messages instead of sending emails.

## Architecture

### Models
- `KycSubmission`: Stores KYC submission data with multi-level approval
- `AuditLog`: Tracks audit events
- `Payment`: Payment transaction records (Sprint 4)
- `SellerAccount`: Stripe Connect account info (Sprint 4)

### Services
- `KycService`: Handles KYC submission, multi-level approval, rejection, and audit logging
- `EmailService`: Sends email notifications for KYC events
- `DashboardService`: Provides statistics and metrics (Sprint 4)
- `StripeService`: Stripe payment integration (Sprint 4)

### Middleware
- `ensureAuthenticated`: JWT authentication middleware
- `ensureAdmin`: Admin role authorization middleware
- **Rate Limiters**: 5 different rate limiters for endpoint protection

### Utils
- `S3PresignService`: Generates presigned S3 URLs
- `cpf-validator`: Brazilian CPF validation with check digit algorithm

### Subscribers
- `KycSubscriber`: Listens to KYC events and sends emails

## Development Notes

- Built with MedusaJS v1 and TypeORM
- Uses PostgreSQL for data storage
- Redis for caching and event bus
- Stripe for payment processing (Sprint 4)
- S3-compatible storage for file uploads
- Complete audit logging for all operations
- Rate limiting on all endpoints
- CPF validation for Brazilian users
- Email notifications (optional)
- Stripe payment processing (Sprint 4)

## Sprints Completed

✅ **Sprint 1**: KYC Submission, S3 Uploads, Audit Logging  
✅ **Sprint 2**: Admin Approval/Rejection Workflow  
✅ **Sprint 3**: Rate Limiting, CPF Validation, Email Notifications  
✅ **Sprint 4**: Admin Dashboard, Multi-Level Workflow, Stripe Payments

## API Endpoints Summary

**Total Endpoints**: 20

- **User (3)**: Storage presign, KYC submission, Get my KYC
- **Admin KYC (4)**: List, Get, Approve, Reject
- **Admin Dashboard (4)**: Stats, Metrics, Activity, Documents
- **Admin Multi-Level (4)**: List by level, Approve level, Escalate, Reject level
- **Payments (4)**: Create seller account, Get account, Create intent, Webhook
- **General (1)**: Stripe webhook

## Future Enhancements (Sprint 5+)

- Order management system
- Product/service listings
- Shopping cart functionality
- Advanced fraud detection (rule-based, non-AI)
- Seller performance analytics
- Buyer/seller ratings and reviews
- Dispute resolution system
- Advanced payment features (subscriptions, installments)
