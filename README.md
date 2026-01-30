# Fuyora Backend - Complete C2C Marketplace ✅

**MARKETPLACE COMPLETO E FUNCIONAL!**

MedusaJS-based C2C marketplace backend with complete KYC workflow, multi-level approval, admin dashboard, **internal ledger payment system**, products, orders, and reviews system.

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
- **Payment Integration**: Payment processing with platform fees (10%)
- **Document Viewer**: Manual document review (NO AI/OCR)

### Sprint 5 - Marketplace Core
- **Products System**: Create, list, update, delete products
- **Orders System**: Complete order lifecycle (pending → paid → delivered → completed)
- **Reviews System**: Bidirectional reviews with ratings and comments
- **Complete Workflow**: Seller lists → Buyer purchases → Reviews

### Sprint 6 - Temporal Release & Disputes 🆕
- **Temporal Balance Release**: Automatic 72h fund release (independent of order completion)
- **Dispute System**: Complete dispute resolution (open → respond → admin resolve)
- **PagSeguro Integration**: Brazil's market leader for payments with PIX, Boleto, and credit cards
- **Native Brazilian Payments**: PIX instant transfers (24/7), Boleto bank slips, local credit cards
- **Scheduled Jobs**: Automated balance release system
- **Dispute Protection**: Disputes block withdrawals but NOT balance release

### Sprint 7 - Financial Rules & Ban System 🚫
- **Explicit Financial Rules**: Clear separation - time governs balance, disputes govern withdrawal
- **Complete Ban System**: Account bans, IP bans, and combined bans
- **Temporary & Permanent Bans**: Flexible duration with expiration tracking
- **Ban Screen**: Clear communication to banned users with reason and expiration
- **Unban Request System**: Formal appeal process for banned users
- **Admin Ban Management**: Full ban lifecycle control
- **IP Blocking**: Block login and registration from banned IPs
- **Force Logout**: Automatic session invalidation on ban
- **Complete Audit**: All ban actions fully logged

### Sprint 8 - Detailed Ban Appeal Form 📝
- **Complete Appeal Form**: 6-section detailed appeal process
- **CPF Validation**: Brazilian tax ID with checksum algorithm
- **User Identification**: Username, email, full name, CPF required
- **Ban History Tracking**: Previous bans and types
- **Rule Acknowledgment**: User must recognize violated rules
- **Appeal Message**: Minimum 50 characters with detailed explanation
- **Mandatory Confirmations**: Terms, truthfulness, consequences (all required)
- **Financial Information**: PIX key collection (informational only)
- **Admin Review Workflow**: Approve, deny, or deny with financial closure
- **No Automatic Payments**: All refunds require manual admin processing
- **Complete Audit**: IP address, user agent, and all decisions logged
- **See**: [SPRINT8_SUMMARY.md](./SPRINT8_SUMMARY.md) for complete details

### 🆕 Sprint 9 - Boleto Expiration & Withdrawal Delay ⏰
- **Boleto Expiration**: Automatic 48h expiration for all boletos
- **Withdrawal Delay**: 48h mandatory delay for all withdrawals (including PIX)
- **Admin Anticipation**: Manual withdrawal processing with reason tracking
- **Scheduled Jobs**: Automated boleto expiration and withdrawal processing
- **Complete Audit**: All delays and anticipations fully logged

### 🎯 FINAL SPRINT - Stripe Removal & PagSeguro Standardization
- **Stripe COMPLETELY REMOVED**: All Stripe code, dependencies, and database fields deleted
- **PagSeguro EXCLUSIVE**: Single payment provider for simplified architecture
- **Cleaner Codebase**: Reduced complexity, fewer dependencies
- **Brazilian Market**: 100% aligned with Brazilian payment methods (PIX, Boleto, Cards)
- **Production Ready**: Final version 1.0 complete
- **See**: [FINAL_VERSION.md](./FINAL_VERSION.md) for complete project summary

### 🎉 V1 FINAL - Language Moderation System 💬
- **Language Detection**: Portuguese profanity, threats, hate speech, harassment
- **Progressive Penalties**: WARNING → 24h → 72h → 7 days bans
- **Never Automatic Permanent**: All permanent bans require manual admin decision
- **User Rights**: View violations, submit appeals, explain context
- **Admin Review**: Confirm, dismiss, reduce penalties, remove bans
- **Complete Audit**: All violations, penalties, and appeals fully logged
- **Context Aware**: No automatic punishments, human review always available
- **See**: [V1_CLOSURE.md](./V1_CLOSURE.md) for official project closure

### 📋 Product Moderation System 🛡️
- **Review Status**: All products require admin review before going live
- **Rejection Reasons**: Moderators must provide specific reasons when rejecting products
- **Transparent Communication**: Sellers see exact rejection reasons
- **Re-submission**: Each product edit triggers new review
- **Admin Endpoints**: List pending products, approve, or reject with reason
- **Examples**: "Você precisa comprovar autoria desse curso", "Não damos suporte para esse tipo de produto"
- **Minimum Reason Length**: 10 characters to ensure clear communication
- **See**: [PRODUCT_MODERATION.md](./PRODUCT_MODERATION.md) for complete documentation

### 🏁 **PROJECT V1 COMPLETE - SCOPE CLOSED** 🏁
**Version**: 1.0.0 FINAL  
**Status**: ✅ COMPLETE AND PRODUCTION READY  
**Date**: January 30, 2026

❌ No more features will be added to V1  
❌ No structural changes without opening V2  
✅ Only bug fixes and performance optimizations allowed  

**All future evolution must be treated as V2 or future roadmap.**

**See [V1_CLOSURE.md](./V1_CLOSURE.md) for official closure declaration.**

### 🆕 Payment Architecture - Internal Ledger System (PagSeguro ONLY)
- **Payment Provider**: PagSeguro (EXCLUSIVE) 🇧🇷
- **Payment Methods**: PIX, Boleto Bancário, Cartão de Crédito nacional
- **Internal Ledger**: Platform-controlled balance tracking
- **Seller Balances**: Available, pending, and held funds
- **Withdrawal System**: Seller-requested, admin-approved withdrawals
- **Complete Audit**: Immutable transaction ledger
- **Brazilian Support**: PIX instant payments, Boleto with expiration
- **Stripe**: COMPLETELY REMOVED ❌
- **See**: [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md) for complete details

## Setup

### Prerequisites

- Node.js >= 16
- PostgreSQL
- Redis
- S3-compatible storage (AWS S3, MinIO, etc.)
- PagSeguro account (for payments)

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

# PagSeguro Payment Provider
PAGSEGURO_EMAIL=your-email@example.com
PAGSEGURO_TOKEN=your_pagseguro_token
PAGSEGURO_SANDBOX=true
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

**Authentication**: Required (Bearer token with admin role)

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

**Authentication**: Required (Bearer token with admin role)

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

**Authentication**: Required (Bearer token with admin role)

**Query Parameters**:
- `limit` (optional): Number of results (default: 10, max: 100)

#### GET /admin/kyc/submissions/:id/documents
Get document URLs for manual viewing.

**Authentication**: Required (Bearer token with admin role)

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

**Authentication**: Required (Bearer token with admin role)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

#### POST /admin/kyc/submissions/:id/approve-level
Approve submission at current level.

**Authentication**: Required (Bearer token with admin role)

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

**Authentication**: Required (Bearer token with admin role)

**Request Body**:
```json
{
  "reason": "Requires senior review due to document complexity"
}
```

Maximum level: 3. Returns error if already at level 3.

#### POST /admin/kyc/submissions/:id/reject-level
Reject submission at any level.

**Authentication**: Required (Bearer token with admin role)

**Request Body**:
```json
{
  "rejection_reason": "Documents are not clear enough"
}
```

### PagSeguro Payments

PagSeguro is Brazil's leading payment processor, integrated as the exclusive payment provider for Fuyora.

#### POST /payments/create-intent
Create payment intent for purchase.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "amount": 10000,
  "currency": "brl",
  "metadata": {
    "product_id": "prod-456",
    "order_id": "order-123"
  }
}
```

Amount in cents (10000 = R$ 100.00). Platform fee is automatically calculated.

**Payment Methods:**
- **PIX**: Instant payment via QR code (24/7, confirmed in seconds)
- **Boleto**: Bank slip payment (1-3 business days)
- **Credit Card**: Brazilian credit cards with installment options

#### POST /webhooks/pagseguro
PagSeguro webhook endpoint for payment confirmations.

### Marketplace - Products

#### POST /products
Create a product listing.

**Authentication**: Required (seller)

**Request Body**:
```json
{
  "title": "Ebook: JavaScript Avançado",
  "description": "Guia completo de JavaScript moderno",
  "price": 49.90,
  "category": "ebooks",
  "digital_product": true,
  "file_url": "https://s3.../ebook.pdf",
  "images": ["https://s3.../cover.jpg"]
}
```

#### GET /products
List products (public).

**Query Parameters**:
- `category`: Filter by category
- `seller_id`: Filter by seller
- `status`: Filter by status (default: ACTIVE)
- `page`, `limit`: Pagination

**Response**:
```json
{
  "products": [...],
  "total": 150
}
```

#### GET /products/:id
Get product details (public).

#### PUT /products/:id
Update product (seller only).

#### DELETE /products/:id
Delete product - sets status to INACTIVE (seller only).

#### GET /seller/products
Get my products as seller.

### Marketplace - Orders

#### POST /orders
Create an order (purchase).

**Authentication**: Required (buyer)

**Request Body**:
```json
{
  "product_id": "prod-uuid",
  "delivery_info": {
    "address": "Rua Example, 123",
    "city": "São Paulo",
    "state": "SP",
    "zip": "01234-567",
    "country": "BR",
    "notes": "Email: user@example.com"
  }
}
```

Product is marked as SOLD after order creation.

#### GET /orders/:id
Get order details (buyer or seller only).

#### GET /buyer/orders
Get my purchases.

#### GET /seller/orders
Get my sales.

#### POST /orders/:id/complete
Mark order as complete (buyer only, after DELIVERED).

#### POST /orders/:id/cancel
Cancel order (buyer or seller, only PENDING).

### Marketplace - Reviews

#### POST /reviews
Create a review (after order completion).

**Authentication**: Required

**Request Body**:
```json
{
  "order_id": "order-uuid",
  "rating": 5,
  "comment": "Excelente produto! Entrega rápida."
}
```

Rating must be 1-5. Both buyer and seller can review each other.

#### GET /users/:id/reviews
Get reviews for a user (public).

**Query Parameters**: `page`, `limit`

#### GET /users/:id/rating
Get average rating for a user (public).

**Response**:
```json
{
  "average_rating": 4.65,
  "total_reviews": 120,
  "rating_breakdown": {
    "5": 85,
    "4": 25,
    "3": 7,
    "2": 2,
    "1": 1
  }
}
```

### Disputes (Sprint 6)

Complete dispute resolution system for buyer protection.

#### POST /disputes
Create a dispute (buyer).

**Authentication**: Required (Buyer)

**Request Body**:
```json
{
  "order_id": "uuid",
  "type": "NOT_RECEIVED|NOT_AS_DESCRIBED|DAMAGED|UNAUTHORIZED|OTHER",
  "description": "Order was never delivered",
  "buyer_evidence": {
    "images": ["https://s3.../screenshot.jpg"],
    "notes": "Tracking shows delivered but nothing received"
  }
}
```

**Response**: 201 Created

**Dispute Types:**
- `NOT_RECEIVED`: Product not received
- `NOT_AS_DESCRIBED`: Product differs from listing
- `DAMAGED`: Product damaged/defective
- `UNAUTHORIZED`: Unauthorized transaction
- `OTHER`: Other issues

#### GET /disputes/:id
Get dispute details (buyer, seller, or admin).

#### GET /buyer/disputes
Get buyer's disputes (paginated).

#### GET /seller/disputes
Get seller's disputes (paginated).

#### POST /disputes/:id/respond
Seller responds to dispute with evidence.

**Authentication**: Required (Seller)

**Request Body**:
```json
{
  "seller_response": "Package was delivered with tracking proof",
  "seller_evidence": {
    "tracking_number": "BR123456789BR",
    "documents": ["https://s3.../tracking.pdf"]
  }
}
```

#### POST /admin/disputes/:id/resolve
Admin resolves dispute (BUYER or SELLER).

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "resolution": "BUYER",
  "notes": "No delivery proof provided. Refund approved."
}
```

**Important Notes:**
- ⏰ Dispute window: 30 days (configurable via `DISPUTE_WINDOW_DAYS`)
- 🚫 Active disputes **block withdrawals** but **do NOT block balance release**
- ✅ Temporal release still proceeds normally (72h) even with active disputes
- 🔒 Only order participants (buyer/seller) and admins can view disputes

### Temporal Balance Release (Sprint 6)

Automatic fund release system for seller protection.

**How it works:**
1. **Order Paid** → Funds go to `pending_balance`
2. **72 Hours Later** → Scheduled job automatically releases funds to `available_balance`
3. **Seller Withdraws** → Can withdraw from `available_balance` (if no active disputes)

**Key Features:**
- ⏰ **Automatic Release**: No manual intervention required
- 🔓 **Independent of Order Status**: Funds release even if order not marked "completed"
- ⚖️ **Dispute Protected**: Disputes block withdrawals but NOT balance release
- 🔧 **Configurable**: Set `BALANCE_RELEASE_HOURS` environment variable (default: 72)

**Balance States:**
```json
{
  "available_balance": 250.00,   // ✅ Can withdraw immediately
  "pending_balance": 100.00,     // ⏳ Waiting for 72h release
  "held_balance": 0.00,          // 🚫 Frozen (not used currently)
  "total_earned": 1500.00,       // 📊 Lifetime earnings
  "total_withdrawn": 1150.00     // 💰 Lifetime withdrawals
}
```

### PagSeguro Payment Integration (Sprint 6)

Brazil's leading payment processor with native support for PIX, Boleto, and local credit cards.

**Why PagSeguro:**
- 🇧🇷 **Market Leader**: Most trusted payment processor in Brazil
- ⚡ **PIX Instant**: Real-time payments 24/7 (confirmed in seconds)
- 🧾 **Boleto**: Traditional bank slip payments (1-3 days)
- 💳 **Local Cards**: Full Brazilian credit card support with installments
- 🔒 **Security**: PCI-DSS compliant with built-in fraud protection
- 💰 **Competitive Fees**: Lower costs compared to international processors

**Configuration:**
```env
PAGSEGURO_EMAIL=your-email@example.com
PAGSEGURO_TOKEN=your_pagseguro_token
PAGSEGURO_SANDBOX=true  # Use sandbox for testing
```

**Payment Methods:**
1. **PIX** - Instant QR code payments (recommended)
2. **Boleto** - Bank slip for unbanked users
3. **Credit Card** - Visa, Mastercard, Elo, Hipercard

**Withdrawal via PIX:**
```json
{
  "amount": 100.00,
  "bank_info": {
    "account_type": "PIX",
    "pix_key": "user@example.com",
    "account_holder_name": "João Silva",
    "account_holder_document": "12345678900"
  }
}
```

Withdrawals arrive instantly (24/7) when using PIX.

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

### Ban Appeals (Sprint 8)

Complete detailed ban appeal form system for banned users.

#### POST /ban-appeals
Submit detailed ban appeal (NO AUTH REQUIRED - accessible from ban screen).

**Request Body:**
```json
{
  "user_id": "uuid (optional)",
  "username": "string (required)",
  "email": "string (required)",
  "full_name": "string (required)",
  "cpf": "12345678900 (required, validated)",
  "previously_banned": true/false,
  "previous_ban_type": "TEMPORARY|PERMANENT|UNKNOWN (required if previously_banned)",
  "knows_violated_rule": true/false,
  "violated_rule_description": "string (optional)",
  "appeal_message": "string (min 50 chars, detailed explanation)",
  "terms_acknowledged": true,
  "information_truthful": true,
  "false_info_consequence_acknowledged": true,
  "pix_key": "string (required, informational)",
  "pix_key_type": "CPF|EMAIL|PHONE|RANDOM"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "appeal": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "PENDING",
    "submitted_at": "2024-01-30T12:00:00Z"
  },
  "message": "Seu pedido de apelação foi enviado..."
}
```

**Form Sections:**
1. **Identification**: Username, email, full name, CPF (validated)
2. **Ban History**: Previously banned? Type?
3. **Rule Recognition**: Know which rule violated?
4. **Appeal Message**: Detailed explanation (min 50 chars)
5. **Confirmations**: 3 mandatory checkboxes (all must be true)
6. **Financial Info**: PIX key (informational only, no auto-payment)

#### GET /admin/ban-appeals
List all ban appeals with filters (ADMIN ONLY).

**Query Params:**
- `status`: PENDING|UNDER_REVIEW|APPROVED|DENIED
- `page`: number (default 1)
- `per_page`: number (default 50)

#### GET /admin/ban-appeals/:id
Get appeal details with complete context (ADMIN ONLY).

**Response includes:**
- Complete appeal form data
- User's ban history (total appeals, approved, denied)
- Current active ban status
- Current account balance

#### POST /admin/ban-appeals/:id/approve
Approve appeal and unban user (ADMIN ONLY).

**Request Body:**
```json
{
  "admin_notes": "User demonstrated genuine remorse. First offense. Approve."
}
```

**Result:** Ban removed, user can login

#### POST /admin/ban-appeals/:id/deny
Deny appeal and keep ban (ADMIN ONLY).

**Request Body:**
```json
{
  "admin_notes": "Repeated offender. Deny." (required)
}
```

**Result:** Ban maintained, no financial action

#### POST /admin/ban-appeals/:id/deny-and-close
Deny appeal and close account financially (ADMIN ONLY).

**Request Body:**
```json
{
  "admin_notes": "Severe fraud. Permanent closure." (required),
  "refund_decision": "REFUND|NO_REFUND|PENDING" (required),
  "refund_amount": 150.00 (required if REFUND),
  "refund_pix_key": "user@example.com" (optional, uses appeal.pix_key if not provided)
}
```

**Result:** Ban maintained + financial closure decision recorded

**Important:** If refund_decision = REFUND, admin must manually process payment via PagSeguro and then mark as processed.

#### POST /admin/ban-appeals/:id/mark-refund-processed
Mark refund as manually processed (ADMIN ONLY).

Called AFTER admin manually processes refund via PagSeguro.

**Appeal System Features:**
- 📝 **Detailed Form**: 6 sections with complete information
- ✅ **CPF Validation**: Brazilian tax ID with checksum algorithm
- 🔒 **Mandatory Confirmations**: All 3 checkboxes required
- 💰 **Financial Info**: PIX key collection (informational only)
- 🚫 **No Auto-Payments**: All refunds require manual admin processing
- 📊 **Complete Context**: Admin sees ban history, balance, current ban
- 📋 **Audit Trail**: IP, user agent, all decisions logged

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

### product (Sprint 5)
- `id`: UUID (primary key)
- `seller_id`: VARCHAR
- `title`: VARCHAR
- `description`: TEXT
- `price`: DECIMAL(10,2)
- `category`: VARCHAR
- `status`: ENUM (DRAFT, ACTIVE, SOLD, INACTIVE)
- `images`: JSONB (array of URLs)
- `digital_product`: BOOLEAN
- `file_url`: VARCHAR (nullable)
- `metadata`: JSONB (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### order (Sprint 5)
- `id`: UUID (primary key)
- `buyer_id`: VARCHAR
- `seller_id`: VARCHAR
- `product_id`: UUID
- `payment_id`: UUID (nullable)
- `amount`: DECIMAL(10,2)
- `status`: ENUM (PENDING, PAID, DELIVERED, COMPLETED, CANCELLED, DISPUTED)
- `delivery_info`: JSONB
- `paid_at`: TIMESTAMP (nullable)
- `delivered_at`: TIMESTAMP (nullable)
- `completed_at`: TIMESTAMP (nullable)
- `cancelled_at`: TIMESTAMP (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### review (Sprint 5)
- `id`: UUID (primary key)
- `order_id`: UUID
- `reviewer_id`: VARCHAR
- `reviewee_id`: VARCHAR
- `rating`: INTEGER (1-5)
- `comment`: TEXT (nullable)
- `type`: ENUM (BUYER_TO_SELLER, SELLER_TO_BUYER)
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
| `BALANCE_RELEASE_HOURS` | Hours before auto-release of funds | `72` |
| `DISPUTE_WINDOW_DAYS` | Days allowed to open disputes | `30` |
| `PAGSEGURO_EMAIL` | PagSeguro account email | - |
| `PAGSEGURO_TOKEN` | PagSeguro API token | - |
| `PAGSEGURO_SANDBOX` | Use PagSeguro sandbox | `true` |

**Note**: Email configuration is optional. If not set, the system logs would-send messages instead of sending emails.

## Architecture

### Models
- `KycSubmission`: Stores KYC submission data with multi-level approval
- `AuditLog`: Tracks audit events
- `Payment`: Payment transaction records
- `Product`: Product listings
- `Order`: Purchase orders
- `Review`: User reviews and ratings
- `Dispute`: Dispute resolution (Sprint 6)
- `SellerBalance`: Internal ledger balances (Sprint 6)
- `Transaction`: Transaction history (Sprint 6)
- `Withdrawal`: Withdrawal requests (Sprint 6)

### Services
- `KycService`: Handles KYC submission, multi-level approval, rejection, and audit logging
- `EmailService`: Sends email notifications for KYC events
- `DashboardService`: Provides statistics and metrics
- `PagSeguroService`: PagSeguro payment integration
- `ProductService`: Product management
- `OrderService`: Order lifecycle management
- `ReviewService`: Review and rating system
- `DisputeService`: Dispute resolution (Sprint 6)
- `LedgerService`: Internal balance management (Sprint 6)
- `WithdrawalService`: Withdrawal processing (Sprint 6)

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
- S3-compatible storage for file uploads
- PagSeguro for payment processing (PIX, Boleto, Credit Cards)
- Complete audit logging for all operations
- Rate limiting on all endpoints
- CPF validation for Brazilian users
- Email notifications (optional)
- Complete marketplace workflow (products, orders, reviews)
- Internal ledger system with temporal balance release

## Sprints Completed

✅ **Sprint 1**: KYC Submission, S3 Uploads, Audit Logging  
✅ **Sprint 2**: Admin Approval/Rejection Workflow  
✅ **Sprint 3**: Rate Limiting, CPF Validation, Email Notifications  
✅ **Sprint 4**: Admin Dashboard, Multi-Level Workflow, Payments  
✅ **Sprint 5**: Products, Orders, Reviews - **MARKETPLACE COMPLETO** 🎉  
✅ **Sprint 6**: Temporal Release (72h), Disputes, PagSeguro Integration 🇧🇷

## API Endpoints Summary

**Total Endpoints**: 84 (72 previous + 3 new language violations + 6 ban appeals + 3 product moderation)

- **User (3)**: Storage presign, KYC submission, Get my KYC
- **Admin KYC (4)**: List, Get, Approve, Reject
- **Admin Dashboard (4)**: Stats, Metrics, Activity, Documents
- **Admin Multi-Level (4)**: List by level, Approve level, Escalate, Reject level
- **Payments (2)**: Create intent, Webhook
- **Products (6)**: Create, List, Get, Update, Delete, My Products
- **Admin Product Moderation (3)**: List pending, Approve, Reject with reason 🆕
- **Orders (6)**: Create, Get, Buyer Orders, Seller Orders, Complete, Cancel
- **Reviews (3)**: Create, Get Reviews, Get Rating
- **Disputes (6)**: Create, Get, Buyer Disputes, Seller Disputes, Respond, Admin Resolve
- **Ledger (10)**: Balance, Transactions, Withdrawals (create, approve, reject, list)
- **Ban Management (5)**: Ban user, Ban IP, Ban both, List bans, Unban
- **Unban Requests (4)**: Submit request, Ban status check, List requests (admin), Approve/Deny (admin)
- **Ban Appeals (7)**: Submit appeal, List appeals (admin), Get appeal details (admin), Approve, Deny, Deny + Close, Mark refund processed
- **Language Violations (6)**: User violations, Appeal violation, Admin list, Dismiss, Confirm, Remove ban
- **Webhooks (1)**: PagSeguro webhook

## Complete Marketplace Workflow

### Seller Flow
1. Sign up → Submit KYC → Wait for approval
2. KYC approved → Start selling
3. Create products → **Admin reviews** 🆕
4. **Product approved** → Published (status: ACTIVE) 🆕
5. **If rejected** → See reason → Edit → Resubmit 🆕
6. Receive orders → Deliver products
7. Receive reviews from buyers

### Buyer Flow
1. Browse **approved** products → Check seller ratings 🆕
2. Create order → Pay via PagSeguro (PIX/Boleto/Card)
3. Receive product
4. Complete order → Leave review

### Moderator Flow (NEW) 🆕
1. View pending products
2. Review product details
3. Either:
   - Approve → Product goes live
   - Reject with reason → Seller sees reason and can fix
4. Seller edits → Product goes back to pending review

## Documentation

Detailed sprint documentation:
- [SPRINT1_SUMMARY.md](./SPRINT1_SUMMARY.md) - KYC, S3 Uploads, Audit Logging
- [SPRINT2_SUMMARY.md](./SPRINT2_SUMMARY.md) - Admin Approval Workflow
- [SPRINT3_SUMMARY.md](./SPRINT3_SUMMARY.md) - Rate Limiting, CPF Validation, Email
- [SPRINT4_SUMMARY.md](./SPRINT4_SUMMARY.md) - Dashboard, Multi-Level, Payments
- [SPRINT5_SUMMARY.md](./SPRINT5_SUMMARY.md) - Products, Orders, Reviews
- [SPRINT6_SUMMARY.md](./SPRINT6_SUMMARY.md) - Temporal Release, Disputes, PagSeguro Integration
- [SPRINT7_SUMMARY.md](./SPRINT7_SUMMARY.md) - Financial Rules Clarification & Complete Ban System
- [SPRINT8_SUMMARY.md](./SPRINT8_SUMMARY.md) - Detailed Ban Appeal Form
- [SPRINT9_SUMMARY.md](./SPRINT9_SUMMARY.md) - Boleto Expiration & Withdrawal Delay
- [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md) - Internal Ledger System
- [PRODUCT_MODERATION.md](./PRODUCT_MODERATION.md) - Product Review System 🆕
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Complete Project Overview
- [FINAL_VERSION.md](./FINAL_VERSION.md) - Version 1.0 Final Summary
- [V1_CLOSURE.md](./V1_CLOSURE.md) - Official V1 Closure

## Future Enhancements (Sprint 8+)

- Full-text search for products
- Shopping cart functionality
- Advanced fraud detection (rule-based, non-AI)
- Seller performance analytics
- Advanced payment features (subscriptions, installments)
- Automated refund processing
- Multi-language support
