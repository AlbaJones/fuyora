# 🗺️ Frontend Roadmap - Fuyora Marketplace

Roadmap completo do frontend com todos os 6 sprints planejados.

---

## 📊 Status Geral

**Total de Sprints**: 6
**Completos**: 4 ✅✅✅✅
**Documentados**: 2 📝📝

---

## ✅ Sprints Completos (1-4)

### Sprint 1: Landing + Setup ✅
**Status**: Implementado
**Pages**: 1 (landing)
**Components**: 3 UI
**Features**: Landing page profissional, setup completo

### Sprint 2: Authentication ✅
**Status**: Implementado
**Pages**: 3 (login, register, banned)
**Components**: 8 UI + 3 custom
**Features**: Login, register, ban system, protected routes

### Sprint 3: Marketplace ✅
**Status**: Implementado
**Pages**: 4 (products, product detail, checkout, orders)
**Components**: 1 UI (skeleton)
**Features**: Product listing, search, filters, purchase, order tracking

### Sprint 4: Seller Area ✅
**Status**: UI Components implementados + Specs documentadas
**Pages**: 6 (dashboard, products, new, edit, sales, balance)
**Components**: 5 UI (tabs, dialog, textarea, table, progress)
**Features**: Product CRUD, sales management, balance tracking

---

## 📝 Próximos Sprints (5-6)

## Sprint 5: User Area 👤

**Objetivo**: Área do usuário com gestão de perfil, KYC e conta

### Pages (5)

#### 1. Profile Management (`/profile/page.tsx`)
**Features**:
- View/edit profile info
- Update email, username, full_name
- Change password
- Avatar upload
- Delete account (with confirmation)

**Components**:
- ProfileForm
- AvatarUploader
- PasswordChangeForm
- DeleteAccountDialog

**API**:
- GET /user/me
- PUT /user/profile
- PUT /user/password
- POST /user/avatar
- DELETE /user/account

#### 2. KYC Submission (`/kyc/page.tsx`)
**Features**:
- KYC form (apenas se kyc_status === NONE ou REJECTED)
- CPF field (validated)
- Document upload (ID front/back, proof of address)
- Address form (CEP, street, number, city, state)
- Submit to admin review
- Real-time validation

**Components**:
- KYCForm
- DocumentUploader (drag & drop, preview)
- AddressForm (CEP lookup)
- CPFInput (formatted)

**API**:
- POST /kyc/submit
- POST /storage/presigned-url (S3 upload)

**Validation**:
- CPF: Brazilian format + checksum
- CEP: 8 digits
- Documents: JPG/PNG/PDF, max 5MB each
- All fields required

#### 3. KYC Status (`/kyc/status/page.tsx`)
**Features**:
- View current KYC status
- Submission details
- Review history
- Rejection reason (if rejected)
- Resubmit button (if rejected)
- Timeline of status changes

**Components**:
- KYCStatusCard
- KYCTimeline
- RejectionReason
- ResubmitButton

**API**:
- GET /kyc/status
- GET /kyc/history

#### 4. Order Details (`/orders/[id]/page.tsx`)
**Features**:
- Complete order information
- Product details
- Seller info
- Payment status
- Delivery tracking
- Cancel order (if pending)
- Mark as received (if delivered)
- Review product (if completed)
- Contact seller button
- Dispute button (if eligible)

**Components**:
- OrderHeader
- OrderTimeline
- ProductInfo
- SellerCard
- OrderActions
- DisputeForm

**API**:
- GET /orders/:id
- POST /orders/:id/cancel
- POST /orders/:id/complete
- POST /orders/:id/dispute

#### 5. Reviews Management (`/reviews/page.tsx`)
**Features**:
- List all user's reviews
- Filter by product/rating
- Edit reviews (within 7 days)
- Delete reviews
- View seller responses

**Components**:
- ReviewList
- ReviewCard
- ReviewForm
- RatingStars

**API**:
- GET /user/reviews
- PUT /reviews/:id
- DELETE /reviews/:id

---

### Components Needed (12)

**Profile**:
1. ProfileForm
2. AvatarUploader
3. PasswordChangeForm
4. DeleteAccountDialog

**KYC**:
5. KYCForm
6. DocumentUploader
7. AddressForm
8. KYCStatusCard
9. KYCTimeline

**Orders**:
10. OrderTimeline
11. DisputeForm

**Reviews**:
12. ReviewForm

---

### User Flows

**Update Profile**:
```
1. Go to /profile
2. Edit fields
3. Upload new avatar (optional)
4. Submit
5. Profile updated
```

**Submit KYC**:
```
1. Go to /kyc (if not approved)
2. Fill CPF, address
3. Upload documents (ID, proof)
4. Submit
5. kyc_status = PENDING
6. Wait for admin review
7. If approved: can_sell = true
```

**View Order Details**:
```
1. Go to /orders
2. Click order
3. → /orders/[id]
4. View full details
5. Actions: Cancel/Complete/Dispute/Review
```

**Manage Reviews**:
```
1. Go to /reviews
2. View all reviews
3. Edit/Delete (if recent)
4. See seller responses
```

---

## Sprint 6: Admin Panel 🛡️

**Objetivo**: Painel administrativo completo com todas as ferramentas de moderação

### Pages (8)

#### 1. Admin Dashboard (`/admin/dashboard/page.tsx`)
**Features**:
- Platform statistics
- Pending items count (KYC, products, disputes, withdrawals)
- Recent activity feed
- Revenue charts
- User growth chart
- Top sellers/buyers
- Quick actions

**Components**:
- AdminStats (grid de cards)
- PendingItemsWidget
- ActivityFeed
- RevenueChart
- UserGrowthChart
- TopUsersTable

**API**:
- GET /admin/dashboard

**Stats**:
- Total users, sellers, products
- Pending KYCs, products, disputes
- Total revenue, fees collected
- Active orders

#### 2. KYC Moderation (`/admin/kyc/page.tsx`)
**Features**:
- List pending KYCs
- View submission details
- View uploaded documents
- Approve KYC
- Reject KYC (with reason)
- KYC history
- Bulk actions

**Components**:
- KYCReviewTable
- KYCReviewCard
- DocumentViewer
- ApprovalDialog
- RejectionDialog

**API**:
- GET /admin/kyc/pending
- GET /admin/kyc/:id
- POST /admin/kyc/:id/approve
- POST /admin/kyc/:id/reject

**Actions**:
- Approve → kyc_status = APPROVED, can_sell = true
- Reject → kyc_status = REJECTED, reason required

#### 3. Product Moderation (`/admin/products/page.tsx`)
**Features**:
- List pending products (review_status = PENDING)
- View product details
- Approve product
- Reject product (with reason)
- Edit product (admin override)
- Product history
- Bulk actions

**Components**:
- ProductModerationTable
- ProductReviewCard
- ApprovalDialog
- RejectionDialog

**API**:
- GET /admin/products/pending
- GET /admin/products/:id
- POST /admin/products/:id/approve
- POST /admin/products/:id/reject

**Actions**:
- Approve → status = ACTIVE
- Reject → status = DRAFT, rejection_reason set

#### 4. User Management (`/admin/users/page.tsx`)
**Features**:
- List all users
- Search by email/username
- Filter by role/status
- View user details
- Ban user (account/IP)
- Unban user
- Change user role (promote to admin)
- View user activity

**Components**:
- UserManagementTable
- UserDetailsDialog
- BanDialog
- RoleChangeDialog

**API**:
- GET /admin/users
- GET /admin/users/:id
- POST /admin/users/:id/ban
- DELETE /admin/users/:id/ban
- PUT /admin/users/:id/role

#### 5. Dispute Resolution (`/admin/disputes/page.tsx`)
**Features**:
- List all disputes
- Filter by status
- View dispute details
- View order details
- Chat with buyer/seller
- Resolve dispute (refund/reject)
- Close dispute

**Components**:
- DisputeTable
- DisputeDetailsCard
- DisputeChat
- ResolutionForm

**API**:
- GET /admin/disputes
- GET /admin/disputes/:id
- POST /admin/disputes/:id/resolve
- POST /admin/disputes/:id/message

**Actions**:
- Refund buyer → creates refund transaction
- Reject dispute → order proceeds normally
- Partial refund → custom amount

#### 6. Ban Management (`/admin/bans/page.tsx`)
**Features**:
- List all bans
- Filter by type/status
- View ban details
- Unban user
- View ban appeals
- Approve/deny appeals

**Components**:
- BanTable
- BanDetailsCard
- AppealReviewCard
- UnbanDialog

**API**:
- GET /admin/bans
- GET /admin/bans/:id
- DELETE /admin/bans/:id (unban)
- GET /admin/ban-appeals
- POST /admin/ban-appeals/:id/approve
- POST /admin/ban-appeals/:id/deny

#### 7. Withdrawal Approval (`/admin/withdrawals/page.tsx`)
**Features**:
- List pending withdrawals
- View withdrawal details
- View seller balance history
- Approve withdrawal (process)
- Deny withdrawal (with reason)
- View processed withdrawals
- Manual anticipation

**Components**:
- WithdrawalTable
- WithdrawalDetailsCard
- ApprovalDialog
- DenyDialog

**API**:
- GET /admin/withdrawals/pending
- GET /admin/withdrawals/:id
- POST /admin/withdrawals/:id/approve
- POST /admin/withdrawals/:id/deny
- POST /admin/withdrawals/:id/anticipate

#### 8. Reports & Analytics (`/admin/reports/page.tsx`)
**Features**:
- Revenue reports
- Sales reports
- User reports
- Product reports
- Date range selector
- Export to CSV/PDF
- Charts and graphs

**Components**:
- ReportFilters
- RevenueChart
- SalesChart
- UserChart
- ProductChart
- ExportButton

**API**:
- GET /admin/reports/revenue
- GET /admin/reports/sales
- GET /admin/reports/users
- GET /admin/reports/products

---

### Components Needed (15)

**Dashboard**:
1. AdminStats
2. PendingItemsWidget
3. ActivityFeed
4. RevenueChart
5. UserGrowthChart

**Moderation**:
6. KYCReviewCard
7. ProductReviewCard
8. DocumentViewer

**Management**:
9. UserManagementTable
10. BanDialog
11. DisputeResolution
12. WithdrawalApproval

**Reports**:
13. ReportFilters
14. ChartWrapper
15. ExportButton

---

### Admin Flows

**Approve KYC**:
```
1. Go to /admin/kyc
2. View pending KYCs
3. Click to review
4. View documents
5. Approve/Reject
6. User notified
```

**Moderate Product**:
```
1. Go to /admin/products
2. View pending products
3. Review product
4. Approve/Reject with reason
5. Seller notified
```

**Resolve Dispute**:
```
1. Go to /admin/disputes
2. View dispute
3. Review order + chat
4. Decide: Refund/Reject
5. Process resolution
6. Both parties notified
```

**Approve Withdrawal**:
```
1. Go to /admin/withdrawals
2. View pending
3. Check seller balance
4. Approve
5. Payment processed via PagSeguro
6. Seller notified
```

---

## 📊 Project Totals (After All 6 Sprints)

### Pages
**Total**: ~30 pages
- Public: 1 (landing)
- Auth: 3 (login, register, banned)
- Marketplace: 4 (products, detail, checkout, orders)
- Seller: 6 (dashboard, products, new, edit, sales, balance)
- User: 5 (profile, kyc, kyc status, order detail, reviews)
- Admin: 8 (dashboard, kyc, products, users, disputes, bans, withdrawals, reports)

### Components
**Total**: ~100 components
- UI: 20
- Custom: 80

### Estimated Lines
**Total**: ~20,000 lines
- Pages: ~8,000
- Components: ~12,000

---

## 🎯 Success Criteria (Final)

### Functionality
✅ Complete user authentication
✅ Full marketplace (browse, buy, track)
✅ Complete seller area (products, sales, balance)
✅ User profile management
✅ KYC submission and tracking
✅ Complete admin panel
✅ All moderation tools
✅ Reports and analytics

### Code Quality
✅ TypeScript 100%
✅ All pages functional
✅ All API integrated
✅ Error handling
✅ Loading states
✅ Empty states
✅ Responsive design
✅ Accessible (ARIA)

### Business Rules
✅ Permission-based access (can_sell)
✅ KYC approval flow
✅ Product moderation
✅ Dispute resolution
✅ Ban system
✅ Withdrawal approval
✅ Complete audit trail

---

## 🚀 Implementation Priority

**High Priority** (Core Features):
1. ✅ Sprint 1: Landing
2. ✅ Sprint 2: Auth
3. ✅ Sprint 3: Marketplace
4. 📝 Sprint 4: Seller Area
5. 📝 Sprint 5: User Area

**Medium Priority** (Admin Tools):
6. 📝 Sprint 6: Admin Panel

---

## 📝 Notes

- Cada sprint deve ser implementado com **código real funcional**
- Documentação é complementar, não substitui implementação
- Testes devem ser adicionados conforme possível
- UI/UX deve ser consistente em todos os sprints
- Acessibilidade deve ser considerada em todos os componentes

---

**ROADMAP COMPLETO - 6 SPRINTS** 🎉

**Status**: 4 implementados, 2 documentados

**Pronto para continuar!** 🚀
