# EMI Enforcement & Device Control System – Complete Documentation

**Version:** 2.0
**Date:** 24 February 2026
**Author:** Grok (Team Lead)
**Status:** Production-Ready
**Architecture:** Hybrid (NestJS Backend + PostgreSQL + Redis + Firebase FCM only)
**Target:** Android 8.0+ financed smartphones in India (RBI/DPDP compliant)

---

## 1. Executive Summary

This system allows lenders/retailers to finance Android devices on EMI and automatically enforce payment compliance through progressive device locking (reminder → soft overlay → hard lock).

**Core Features**
- Real-time Razorpay payment tracking
- Automated overdue detection (cron + queues)
- Multi-stage device lock via Device Admin + Accessibility + Overlay
- Offline fallback lock
- Full audit trail for RBI compliance
- Web admin dashboard for retailers/lenders

**Success Metrics**
- ≥85% recovery within grace period
- Unlock latency < 8 seconds (99th percentile)
- <2% daily battery impact
- 100% consent captured at activation

---

## 2. Database Design (PostgreSQL + Prisma)

### 2.1 Design Principles
- Full ACID transactions (critical for payment → status → lock)
- Immutable audit logs
- Partitioning support for 100k+ devices
- Row-Level Security ready
- Soft deletes + automatic timestamps

### 2.2 Complete Prisma Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id              String         @id @default(cuid())
  mobile          String         @unique
  aadhaarHash     String?
  consentHash     String
  consentGivenAt  DateTime       @default(now())
  status          UserStatus     @default(ACTIVE)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  devices         Device[]
  emiSchedules    EmiSchedule[]
  payments        Payment[]      @relation("UserPayments")
}

enum UserStatus { ACTIVE | SUSPENDED | SETTLED }

model Device {
  imei            String         @id
  userId          String
  fcmToken        String?
  isLocked        Boolean        @default(false)
  currentLockStage Int           @default(0)   // 0=normal, 1=reminder, 2=soft, 3=hard
  lastSyncAt      DateTime       @default(now())
  offlineLockUntil DateTime?
  simBinding      String?        // ICCID for offline
  createdAt       DateTime       @default(now())

  user            User           @relation(fields: [userId], references: [id])
  emiSchedule     EmiSchedule?
  lockHistory     LockHistory[]
}

model EmiSchedule {
  id              String         @id @default(cuid())
  userId          String
  deviceImei      String         @unique
  principalAmount Decimal
  emiAmount       Decimal
  tenureMonths    Int
  dueDate         DateTime
  nextDueDate     DateTime
  status          EmiStatus      @default(ACTIVE)
  graceDays       Int            @default(3)
  totalPaid       Decimal        @default(0)
  createdAt       DateTime       @default(now())

  user            User           @relation(fields: [userId], references: [id])
  device          Device         @relation(fields: [deviceImei], references: [imei])
  payments        Payment[]
}

enum EmiStatus { ACTIVE | OVERDUE | PAID | SETTLED | DEFAULTED }

model Payment {
  id              String         @id @default(cuid())
  emiId           String
  txnId           String         @unique
  userId          String
  amount          Decimal
  status          PaymentStatus
  paidAt          DateTime?
  razorpayPayload Json
  createdAt       DateTime       @default(now())

  emi             EmiSchedule    @relation(fields: [emiId], references: [id])
  user            User           @relation("UserPayments", fields: [userId], references: [id])
}

enum PaymentStatus { PENDING | SUCCESS | FAILED | REFUNDED }

model LockHistory {
  id              String         @id @default(cuid())
  deviceImei      String
  stage           Int
  reason          String
  lockedAt        DateTime       @default(now())
  unlockedAt      DateTime?
  unlockedBy      String?
  metadata        Json?

  device          Device         @relation(fields: [deviceImei], references: [imei])
}

model AuditLog {
  id              String         @id @default(cuid())
  entityType      String
  entityId        String
  action          String
  performedBy     String
  beforeState     Json?
  afterState      Json?
  timestamp       DateTime       @default(now())
  ipAddress       String?
}
```

### 2.3 Recommended Indexes
```sql
CREATE INDEX idx_emi_due_status ON "EmiSchedule" (dueDate, status);
CREATE INDEX idx_device_locked ON "Device" (isLocked, currentLockStage);
CREATE INDEX idx_lock_history ON "LockHistory" (deviceImei, lockedAt);
```

---

## 3. Backend PRD (Node.js – NestJS)

### 3.1 Tech Stack
- **Framework**: NestJS 10+ (TypeScript)
- **Database**: PostgreSQL + Prisma
- **Queue/Scheduler**: BullMQ + Redis
- **Push Notifications**: firebase-admin (FCM only)
- **Payment**: Razorpay Node SDK
- **Auth**: JWT + Refresh Tokens + RBAC
- **Logging**: Winston + Sentry
- **Deployment**: Docker + PM2 / Railway / AWS Mumbai

### 3.2 Module Structure
```
src/
├── auth/
├── users/
├── devices/
├── emi/
├── payments/
├── locks/
├── webhooks/          # Razorpay
├── notifications/
├── admin/
├── common/            # guards, interceptors, audit
├── scheduler/         # BullMQ processors
└── prisma/
```

### 3.3 Key API Endpoints

| Method | Endpoint                  | Description                        | Auth     |
|--------|---------------------------|------------------------------------|----------|
| POST   | `/devices/activate`       | Retailer activation + consent      | Retailer |
| POST   | `/webhooks/razorpay`      | Payment webhook (signature validated) | Public (signature) |
| POST   | `/locks/trigger`          | Force lock (admin/system)          | Admin    |
| POST   | `/locks/unlock`           | Manual unlock                      | Admin    |
| GET    | `/emi/status/:imei`       | Real-time EMI + lock status        | Any      |
| GET    | `/admin/reports/overdue`  | Overdue aging report               | Admin    |

### 3.4 Critical Flows
1. **Activation** → Create User + Device + EmiSchedule atomically
2. **Webhook** → Validate → Prisma transaction → Update EMI → FCM unlock
3. **Overdue Job** (every 4 hours) → Find overdue → Apply lock stage → Log
4. **Offline Lock** → Device checks local `offlineLockUntil`

---

## 4. Android Frontend PRD (Kotlin)

### 4.1 Tech Stack
- Kotlin + Jetpack (MVVM, Hilt, WorkManager, Room, Navigation)
- DevicePolicyManager + AccessibilityService + WindowManager
- Firebase SDK (FCM)
- Razorpay Android SDK
- SQLCipher (encrypted local DB)

### 4.2 Permissions (with rationale)
- `DEVICE_ADMIN` → `lockNow()`
- `SYSTEM_ALERT_WINDOW` → Persistent "Pay Now" overlay
- `BIND_ACCESSIBILITY_SERVICE` → Block non-essential apps
- `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`

### 4.3 Lock Stages Implementation
```kotlin
// Stage 2 Soft Lock
showSystemOverlay("EMI Due - Pay to Unlock", razorpayDeepLink)

// Stage 3 Hard Lock
devicePolicyManager.lockNow()
accessibilityService.blockLauncherApps()
```

### 4.4 Offline Fallback
- WorkManager + AlarmManager checks local encrypted EMI copy
- SIM-binding + time-based lock

### 4.5 Key Screens
- Activation Consent (mandatory signature pad)
- Unlocked Dashboard (EMI progress circle)
- Lock Overlay (Hindi/English, emergency call button)
- Payment Success → immediate unlock

---

## 5. Web Admin Dashboard PRD (React.js)

### 5.1 Tech Stack
- React 19 + TypeScript + Vite
- Refine.dev / Ant Design Pro
- TanStack Query
- Recharts

### 5.2 Key Pages
- Login + RBAC
- Overview KPIs + charts
- Devices list (search IMEI/mobile, bulk actions)
- Payments reconciliation
- Reports (collection rate, NPA buckets, retailer-wise)

---

## 6. Security & Compliance

- TLS 1.3 everywhere
- Razorpay webhook signature mandatory
- Immutable `AuditLog` table
- DPDP 2023 consent storage
- RBI remote-locking guidelines (emergency 112 always allowed)
- Data retention: 7 years for financial records

---

## 7. Deployment & Infrastructure

**Backend**
- Railway / Render (MVP)
- AWS Mumbai (production)

**Database**
- PostgreSQL on Railway / Neon / AWS RDS

**Redis**
- Upstash or ElastiCache

**Android Distribution**
- Sideload APK via retailer portal (not Play Store)
- Firebase App Distribution for updates

**Monthly Cost (10k devices)**
- ₹1,500 – ₹6,000 (far cheaper than pure Firebase at scale)

---

## 8. Development Roadmap (10 weeks – 4 developers)

| Week | Deliverable |
|------|-------------|
| 1-2  | Database + Backend core + Razorpay webhook |
| 3-4  | Lock engine + FCM integration + Offline fallback |
| 5-6  | Android app (activation + lock UI) |
| 7-8  | Admin dashboard + Reports |
| 9   | End-to-end testing on 10 real devices |
| 10  | Beta with 3 retailers in Uttar Pradesh |
