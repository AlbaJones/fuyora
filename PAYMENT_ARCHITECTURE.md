# Payment Architecture - Internal Ledger with PagSeguro

## Overview

This document describes the payment system architecture using an **Internal Ledger** (platform-controlled funds) with **PagSeguro** as the exclusive payment provider for Brazilian payment methods.

## Why Internal Ledger + PagSeguro?

### Benefits of Internal Ledger
- ✅ Platform has full control over all funds
- ✅ No seller payment accounts needed (simpler onboarding)
- ✅ Can implement any business rules
- ✅ Easy to delay payouts (risk management)
- ✅ Better dispute handling (hold/release funds)
- ✅ Complete audit trail
- ✅ Better cash flow management

### Why PagSeguro?
- 🇧🇷 **Market Leader**: Brazil's most trusted payment processor
- ⚡ **PIX Instant**: Real-time payments 24/7 (confirmed in seconds)
- 🧾 **Boleto Support**: Traditional bank slip payments
- 💳 **Local Credit Cards**: Full Brazilian credit card support
- 🔒 **Security**: PCI-DSS compliant with fraud protection
- 💰 **Lower Fees**: Competitive rates for Brazilian merchants
- 📱 **Mobile Optimized**: Seamless mobile payment experience

## Architecture

### Payment Flow with PagSeguro

```
┌──────────┐
│ Customer │
└────┬─────┘
     │ Payment (PIX/Boleto/Card)
     ▼
┌──────────────────┐
│   PagSeguro      │
│ Platform Account │
└────────┬─────────┘
         │ 100% of payment
         ▼
┌──────────────────┐
│ Internal Ledger  │
│                  │
│  Seller Balance: │
│  ├─ Pending      │
│  ├─ Available    │
│  └─ Held         │
└────────┬─────────┘
         │
         │ Seller requests
         │ withdrawal
         ▼
┌──────────────────┐
│ Admin Approves   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ PagSeguro        │
│ Transfer (PIX)   │
└────────┬─────────┘
         │ Instant (PIX) or 1-3 days
         ▼
┌──────────┐
│  Seller  │
│   Bank   │
└──────────┘
```

## Database Schema

### Tables

#### `seller_balance`
Tracks internal balance for each seller.

```sql
CREATE TABLE seller_balance (
  id uuid PRIMARY KEY,
  seller_id varchar NOT NULL UNIQUE,
  available_balance decimal(12,2) DEFAULT 0,  -- Can withdraw
  pending_balance decimal(12,2) DEFAULT 0,    -- Recent sales
  held_balance decimal(12,2) DEFAULT 0,       -- Disputes/holds
  total_earned decimal(12,2) DEFAULT 0,       -- Lifetime earnings
  total_withdrawn decimal(12,2) DEFAULT 0,    -- Lifetime withdrawals
  created_at timestamp,
  updated_at timestamp
);
```

#### `transaction`
Immutable ledger of all balance changes.

```sql
CREATE TABLE transaction (
  id uuid PRIMARY KEY,
  seller_id varchar NOT NULL,
  type transaction_type_enum NOT NULL,
  amount decimal(12,2) NOT NULL,             -- +credit, -debit
  balance_after decimal(12,2) NOT NULL,
  reference_id varchar,                       -- order_id, withdrawal_id, etc.
  reference_type varchar,                     -- 'order', 'withdrawal', etc.
  description text,
  status transaction_status_enum DEFAULT 'COMPLETED',
  metadata jsonb,
  created_at timestamp
);
```

**Transaction Types**:
- `SALE` - Sale credit (pending initially)
- `SALE_AVAILABLE` - Sale becomes available for withdrawal
- `WITHDRAWAL` - Withdrawal debit
- `REFUND` - Customer refund
- `PLATFORM_FEE` - Platform fee debit
- `HOLD` - Move funds to held
- `RELEASE` - Release held funds
- `CHARGEBACK` - Card chargeback
- `ADJUSTMENT` - Manual admin adjustment

#### `withdrawal`
Seller withdrawal requests.

```sql
CREATE TABLE withdrawal (
  id uuid PRIMARY KEY,
  seller_id varchar NOT NULL,
  amount decimal(12,2) NOT NULL,
  status withdrawal_status_enum DEFAULT 'PENDING',
  bank_info jsonb NOT NULL,                  -- PIX key or bank details
  stripe_transfer_id varchar,                -- Stripe transfer ID
  approved_by varchar,                       -- Admin who approved
  processed_by varchar,                      -- Admin who processed
  rejection_reason text,
  failure_reason text,
  requested_at timestamp,
  approved_at timestamp,
  processed_at timestamp,
  completed_at timestamp,
  created_at timestamp,
  updated_at timestamp
);
```

**Withdrawal Statuses**:
- `PENDING` - Requested by seller
- `APPROVED` - Approved by admin
- `PROCESSING` - Being processed via PagSeguro
- `COMPLETED` - Successfully transferred
- `FAILED` - Transfer failed
- `CANCELLED` - Cancelled

**Bank Info** (JSONB):
```json
{
  "account_type": "PIX | BANK_TRANSFER",
  "pix_key": "user@email.com",              // For PIX (recommended)
  "bank_code": "001",                        // For bank transfer
  "account_number": "12345-6",
  "account_holder_name": "João Silva",
  "account_holder_document": "123.456.789-00"
}
```

### Modified Tables

#### `payment`
- Simplified to work with PagSeguro
- Removed: Payment processor specific fields
- Changed: `seller_amount` → `seller_net_amount` (clearer naming)
- Kept: `platform_fee`, `seller_net_amount`

## Payment Flow

### 1. Customer Makes Payment

```typescript
// Frontend calls
POST /payments/create-intent
{
  "amount": 10000,  // R$ 100.00 in cents
  "seller_id": "seller_user_id",
  "order_id": "order_uuid"
}

// Response
{
  "payment_intent_id": "pi_...",
  "client_secret": "pi_...secret...",
  "message": "Payment will be processed via platform account..."
}
```

**What happens**:
- Payment processed by PagSeguro (PIX, Boleto, or Credit Card)
- Funds go to platform PagSeguro account
- Platform fee (10%) calculated
- Payment record created in database

### 2. Order is Paid

When payment succeeds (webhook):

```typescript
// LedgerService.creditSale()
// Creates transaction:
{
  type: "SALE",
  amount: 90.00,              // R$ 100 - R$ 10 fee
  seller_id: "...",
  reference_id: "order_id",
  reference_type: "order"
}

// Updates seller_balance:
pending_balance += 90.00
total_earned += 90.00
```

### 3. Order is Completed

When buyer confirms receipt:

```typescript
// LedgerService.makeSaleAvailable()
// Creates transaction:
{
  type: "SALE_AVAILABLE",
  amount: 90.00,
  seller_id: "..."
}

// Updates seller_balance:
pending_balance -= 90.00
available_balance += 90.00
```

### 4. Seller Requests Withdrawal

```typescript
POST /seller/withdrawals/request
{
  "amount": 90.00,
  "bank_info": {
    "account_type": "PIX",
    "pix_key": "joao@example.com"
  }
}
```

**Validations**:
- Amount > MIN_WITHDRAWAL_AMOUNT (default: R$ 10)
- Amount <= available_balance
- Bank info is valid

**Creates**:
- Withdrawal record (status: PENDING)

### 5. Admin Approves Withdrawal

```typescript
POST /admin/withdrawals/:id/approve
```

**Updates**:
- Status: PENDING → APPROVED
- approved_by: admin_user_id
- approved_at: timestamp

### 6. Admin Processes Withdrawal

```typescript
POST /admin/withdrawals/:id/process
```

**What happens**:
1. Debit from ledger:
   ```typescript
   // LedgerService.debitWithdrawal()
   available_balance -= amount
   total_withdrawn += amount
   ```

2. Call PagSeguro API (PIX transfer):
   ```typescript
   // PagSeguroService.createTransfer()
   // Instant PIX transfer to seller's PIX key
   ```

3. Update withdrawal:
   ```
   status: PROCESSING → COMPLETED
   pagseguro_transfer_id: "TR123..."
   processed_by: admin_user_id
   completed_at: timestamp
   ```

4. Funds arrive instantly (PIX) or 1-3 days (bank transfer)

## API Endpoints

### Seller Endpoints

#### GET /seller/balance
Get current balance.

**Response**:
```json
{
  "available_balance": "90.00",
  "pending_balance": "45.00",
  "held_balance": "0.00",
  "total_earned": "1250.00",
  "total_withdrawn": "800.00"
}
```

#### GET /seller/transactions
Get transaction history.

**Query params**: `limit`, `offset`

**Response**:
```json
{
  "transactions": [
    {
      "id": "...",
      "type": "SALE",
      "amount": "90.00",
      "balance_after": "90.00",
      "description": "Sale credit for order abc123",
      "created_at": "2024-01-30T12:00:00Z"
    }
  ],
  "total": 42
}
```

#### POST /seller/withdrawals/request
Request a withdrawal.

**Body**:
```json
{
  "amount": 90.00,
  "bank_info": {
    "account_type": "PIX",
    "pix_key": "user@email.com"
  }
}
```

**Response**:
```json
{
  "id": "withdrawal_uuid",
  "amount": "90.00",
  "status": "PENDING",
  "requested_at": "...",
  "message": "Withdrawal requested successfully. Processing typically takes 2 business days."
}
```

#### GET /seller/withdrawals
List my withdrawals.

#### POST /seller/withdrawals/:id/cancel
Cancel a PENDING withdrawal.

### Admin Endpoints

#### GET /admin/withdrawals
List all withdrawals.

**Query params**: `status`, `limit`, `offset`

#### POST /admin/withdrawals/:id/approve
Approve a PENDING withdrawal.

#### POST /admin/withdrawals/:id/process
Process an APPROVED withdrawal (triggers Stripe transfer).

#### POST /admin/withdrawals/:id/reject
Reject a PENDING withdrawal with reason.

## Services

### LedgerService

Manages all balance operations.

**Key Methods**:
- `getBalance(sellerId)` - Get current balance
- `creditSale(sellerId, amount, orderId)` - Credit pending balance
- `makeSaleAvailable(sellerId, amount, orderId)` - Move to available
- `debitWithdrawal(sellerId, amount, withdrawalId)` - Debit for withdrawal
- `processRefund(sellerId, amount, orderId)` - Handle refund
- `holdFunds(sellerId, amount, reason)` - Hold funds
- `releaseFunds(sellerId, amount, reason)` - Release funds
- `getTransactions(sellerId)` - Get transaction history
- `manualAdjustment(sellerId, amount, reason, adminId)` - Admin adjustment

### WithdrawalService

Manages withdrawal lifecycle.

**Key Methods**:
- `requestWithdrawal(sellerId, amount, bankInfo)` - Seller requests
- `approveWithdrawal(withdrawalId, adminId)` - Admin approves
- `processWithdrawal(withdrawalId, adminId)` - Process via PagSeguro
- `cancelWithdrawal(withdrawalId, reason, userId)` - Cancel
- `getSellerWithdrawals(sellerId)` - List seller withdrawals
- `getAllWithdrawals(status)` - Admin list all

### PagSeguroService

Handles all PagSeguro payment operations.

**Key Methods**:
- `createPaymentOrder(amount, metadata)` - Create PIX/Boleto/Card payment
- `createTransfer(amount, bankInfo)` - PIX or bank transfer to seller
- `handleWebhook(body, signature)` - Process payment confirmations
- `getPaymentStatus(orderId)` - Check payment status
- `verifyWebhookSignature(body, signature)` - Validate webhooks

**Payment Methods Supported**:
- PIX (instant, recommended)
- Boleto (1-3 business days)
- Credit Card (with installments)

## Environment Variables

### Added
```bash
MIN_WITHDRAWAL_AMOUNT=10  # Minimum withdrawal in BRL
PAGSEGURO_EMAIL=your-email@example.com
PAGSEGURO_TOKEN=your_pagseguro_token
PAGSEGURO_SANDBOX=true
```

## Migration

Run migration to set up the internal ledger system:

```bash
npm run migrations:run
```

This will:
1. Create `seller_balance` table
2. Create `transaction` table
3. Create `withdrawal` table
4. Update `payment` table schema

## Integration with Order Service

When order is created and paid:

```typescript
// In OrderService.createOrder()
const platformFee = amount * (PLATFORM_FEE_PERCENTAGE / 100);
const sellerNetAmount = amount - platformFee;

// Credit seller ledger (pending)
await ledgerService.creditSale(
  sellerId,
  sellerNetAmount,
  orderId,
  `Sale credit for order ${orderId}`
);
```

When order is completed:

```typescript
// In OrderService.completeOrder()
await ledgerService.makeSaleAvailable(
  sellerId,
  sellerNetAmount,
  orderId
);
```

When order is refunded:

```typescript
// In OrderService.refundOrder()
await ledgerService.processRefund(
  sellerId,
  sellerNetAmount,
  orderId,
  `Refund for order ${orderId}`
);
```

## Dispute Handling

When dispute is opened:

```typescript
await ledgerService.holdFunds(
  sellerId,
  amount,
  orderId,
  "Chargeback dispute opened"
);
```

When dispute is won (seller):

```typescript
await ledgerService.releaseFunds(
  sellerId,
  amount,
  orderId,
  "Dispute won, funds released"
);
```

When dispute is lost (platform):

```typescript
// Funds already held, no additional action needed
// Or use CHARGEBACK transaction type
```

## Security Considerations

1. **Balance Integrity**: All balance changes create immutable transaction records
2. **Audit Trail**: Complete history of every operation
3. **Admin Actions**: All admin actions logged with admin_id
4. **Withdrawal Approval**: Two-step process (approve + process)
5. **Minimum Amounts**: Prevents spam withdrawals
6. **Bank Info Validation**: Validates before creating withdrawal

## Testing

### Test Scenarios

1. **Sale Flow**:
   - Customer pays → pending balance increases
   - Order completes → available balance increases
   - Check transaction history

2. **Withdrawal Flow**:
   - Request withdrawal → PENDING status
   - Admin approves → APPROVED status
   - Admin processes → COMPLETED status
   - Check balance decreased

3. **Refund Flow**:
   - Refund order → pending or available decreases
   - Transaction created

4. **Dispute Flow**:
   - Hold funds → held balance increases
   - Release funds → available balance increases

### Manual Testing

```bash
# 1. Check balance
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9000/store/seller/balance

# 2. Request withdrawal
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "bank_info": {"account_type": "PIX", "pix_key": "test@example.com"}}' \
  http://localhost:9000/store/seller/withdrawals/request

# 3. Admin list withdrawals
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:9000/store/admin/withdrawals?status=PENDING

# 4. Admin approve
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:9000/store/admin/withdrawals/{id}/approve

# 5. Admin process
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:9000/store/admin/withdrawals/{id}/process
```

## Future Enhancements

1. **Automatic Withdrawals**: Option for sellers to enable auto-withdrawal via PIX
2. **Withdrawal Schedules**: Weekly/monthly automatic PIX withdrawals
3. **Multi-Currency**: Support USD, EUR, etc. (if expanding beyond Brazil)
4. **Boleto Auto-confirmation**: Automatic confirmation when Boleto is paid
5. **Installment Payments**: Support parcelamento (installments) for credit cards
6. **Withdrawal Fees**: Optional fee for instant PIX withdrawals
7. **Balance Forecasting**: Predict when seller can withdraw based on pending
8. **Withdrawal Batching**: Process multiple PIX transfers in batch

## Support

For issues or questions about the new ledger system:
- Check transaction history for debugging
- Review seller_balance for current state
- Check withdrawal status for payment issues
- Use manual adjustment for corrections (with reason)
