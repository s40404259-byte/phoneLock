# Backend API Specification (NestJS)

## Base
- API Version: v1
- Transport: HTTPS only
- Auth: JWT Bearer for protected endpoints
- Content-Type: `application/json`

## Authentication & Authorization
- Roles: `ADMIN`, `RETAILER`, `SYSTEM`, `CUSTOMER_SUPPORT`
- Public endpoint: Razorpay webhook with signature verification.

---

## 1) Activate Device
`POST /devices/activate`

### Auth
- Required role: `RETAILER`

### Request Body
```json
{
  "mobile": "9876543210",
  "aadhaarHash": "optional_sha256",
  "consentHash": "signed_consent_hash",
  "imei": "356789012345678",
  "fcmToken": "optional_fcm_token",
  "principalAmount": 25000,
  "emiAmount": 2500,
  "tenureMonths": 12,
  "dueDate": "2026-03-05T00:00:00.000Z",
  "nextDueDate": "2026-04-05T00:00:00.000Z",
  "graceDays": 3
}
```

### Behavior
- Executes single DB transaction:
  1. Upsert `User`
  2. Create `Device`
  3. Create `EmiSchedule`
  4. Write `AuditLog`

### Response (201)
```json
{
  "success": true,
  "userId": "cuid",
  "imei": "356789012345678",
  "emiId": "cuid",
  "status": "ACTIVE"
}
```

---

## 2) Razorpay Webhook
`POST /webhooks/razorpay`

### Auth
- Public, protected by Razorpay signature header:
  - `x-razorpay-signature`

### Request
- Raw webhook payload from Razorpay.

### Behavior
- Verify signature.
- Parse payment event.
- Transaction:
  1. Insert/Update `Payment`
  2. Increase `EmiSchedule.totalPaid`
  3. Update EMI status if milestone reached
  4. If overdue/locked, issue unlock via FCM and persist lock release
  5. Write `AuditLog`

### Response (200)
```json
{ "received": true }
```

---

## 3) Trigger Lock
`POST /locks/trigger`

### Auth
- Required role: `ADMIN` or `SYSTEM`

### Request Body
```json
{
  "imei": "356789012345678",
  "stage": 2,
  "reason": "EMI overdue beyond grace period"
}
```

### Behavior
- Set `Device.isLocked = true`
- Set `Device.currentLockStage`
- Add `LockHistory`
- Send FCM lock command payload
- Add `AuditLog`

### Response (200)
```json
{ "success": true, "imei": "356789012345678", "stage": 2 }
```

---

## 4) Manual Unlock
`POST /locks/unlock`

### Auth
- Required role: `ADMIN`

### Request Body
```json
{
  "imei": "356789012345678",
  "reason": "Payment reconciled"
}
```

### Behavior
- Set `Device.isLocked = false`
- Set `Device.currentLockStage = 0`
- Close latest open `LockHistory` entry (`unlockedAt`, `unlockedBy`)
- Send FCM unlock command payload
- Add `AuditLog`

### Response (200)
```json
{ "success": true, "imei": "356789012345678", "stage": 0 }
```

---

## 5) EMI Status by IMEI
`GET /emi/status/:imei`

### Auth
- Any authenticated role

### Response (200)
```json
{
  "imei": "356789012345678",
  "isLocked": false,
  "currentLockStage": 0,
  "emi": {
    "status": "ACTIVE",
    "dueDate": "2026-03-05T00:00:00.000Z",
    "nextDueDate": "2026-04-05T00:00:00.000Z",
    "emiAmount": 2500,
    "totalPaid": 5000,
    "graceDays": 3
  }
}
```

---

## 6) Overdue Report
`GET /admin/reports/overdue`

### Auth
- Required role: `ADMIN`

### Query Parameters
- `from` (ISO date)
- `to` (ISO date)
- `retailerId` (optional)
- `bucket` (optional: `1-30`, `31-60`, `61-90`, `90+`)

### Response (200)
```json
{
  "summary": {
    "totalOverdueAccounts": 123,
    "totalOutstanding": 1450000,
    "recoveryRate": 86.4
  },
  "items": [
    {
      "imei": "356789012345678",
      "mobile": "9876543210",
      "daysOverdue": 14,
      "lockStage": 2,
      "outstanding": 5000
    }
  ]
}
```

---

## Scheduler Contract
- Cron frequency: every 4 hours.
- Job flow:
  1. Fetch `EmiSchedule` where `nextDueDate + graceDays < now` and status not settled.
  2. Compute stage progression.
  3. Trigger lock updates + FCM.
  4. Persist `LockHistory` + `AuditLog`.

## Lock Stage Mapping
- `0`: Normal
- `1`: Reminder (notification only)
- `2`: Soft lock (overlay + app restrictions)
- `3`: Hard lock (`lockNow()` + restricted launcher access)

## Error Model
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "imei is invalid",
    "details": []
  }
}
```

## Compliance Notes
- Preserve immutable audit entries for all payment/lock actions.
- Keep webhook payload snapshots for forensic traceability.
- Always permit emergency call pathways in lock client behavior.
