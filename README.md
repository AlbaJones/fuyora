# Fuyora Backend - Sprint 1

MedusaJS-based marketplace backend with KYC submission, presigned S3 uploads, and audit logging.

## Features

### Sprint 1 Implementation

- **KYC Submission**: Submit KYC documents with personal data
- **Presigned S3 URLs**: Generate secure upload URLs for avatars and KYC documents
- **Audit Logging**: Track KYC submissions and user status changes
- **Authentication**: JWT-based authentication middleware

## Setup

### Prerequisites

- Node.js >= 16
- PostgreSQL
- Redis
- S3-compatible storage (AWS S3, MinIO, etc.)

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

## Architecture

### Models
- `KycSubmission`: Stores KYC submission data
- `AuditLog`: Tracks audit events

### Services
- `KycService`: Handles KYC submission logic, validation, and audit logging

### Middleware
- `ensureAuthenticated`: JWT authentication middleware

### Utils
- `S3PresignService`: Generates presigned S3 URLs

## Development Notes

- Built with MedusaJS v1 and TypeORM
- Uses PostgreSQL for data storage
- Redis for caching and event bus
- S3-compatible storage for file uploads
- Audit logging for all KYC operations

## Future Enhancements (Sprint 3+)

- Rate limiting for all endpoints
- Email notifications for KYC approval/rejection
- CPF format and checksum validation
- Document URL validation
- Implement field-level encryption for PII
- Order processing and Stripe payments with escrow
- Review dashboard and analytics
- Multi-level KYC review workflow
