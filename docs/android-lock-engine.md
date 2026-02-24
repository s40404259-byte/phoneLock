# Android Lock Engine Specification

## Platform & Architecture
- Min SDK: Android 8.0 (API 26)
- Language: Kotlin
- Pattern: MVVM + Hilt DI
- Background: WorkManager + AlarmManager fallback
- Local Data: Room + SQLCipher encrypted storage
- Push: Firebase Cloud Messaging (FCM)

## Components
1. **DeviceAdminReceiver**
   - Enables hard lock (`DevicePolicyManager.lockNow()`).
2. **AccessibilityService**
   - Blocks non-essential apps in stage 2/3.
3. **Overlay Service**
   - Draw-over-app reminder/payment prompt.
4. **Sync Worker**
   - Periodic sync of EMI status + lock commands.
5. **Offline Policy Engine**
   - Applies local lock rules when backend unavailable.

## Required Permissions
- `DEVICE_ADMIN`
- `SYSTEM_ALERT_WINDOW`
- `BIND_ACCESSIBILITY_SERVICE`
- `POST_NOTIFICATIONS`
- `FOREGROUND_SERVICE`

## Lock Stages
### Stage 0 – Normal
- No restrictions.
- App dashboard shows EMI progress and next due date.

### Stage 1 – Reminder
- Persistent notifications and in-app reminders.
- No launcher/app restrictions.

### Stage 2 – Soft Lock
- Full-screen/persistent overlay with Pay Now CTA.
- Accessibility blocks selected non-essential apps.
- Emergency dialer remains accessible.

### Stage 3 – Hard Lock
- Trigger `lockNow()`.
- Accessibility aggressively blocks launcher and configured apps.
- Emergency calling must remain unblocked.

## Kotlin Pseudocode
```kotlin
fun applyLockStage(stage: Int, deepLink: String?) {
    when (stage) {
        0 -> {
            hideOverlay()
            accessibilityController.disableRestrictions()
        }
        1 -> {
            notifier.showReminder()
        }
        2 -> {
            showSystemOverlay("EMI Due - Pay to Unlock", deepLink)
            accessibilityController.enableSoftRestrictions()
        }
        3 -> {
            showSystemOverlay("Device Locked - EMI Overdue", deepLink)
            devicePolicyManager.lockNow()
            accessibilityController.enableHardRestrictions()
        }
    }
}
```

## Offline Fallback Logic
- Store last signed policy blob from server:
  - `currentLockStage`
  - `offlineLockUntil`
  - `simBinding` (ICCID)
  - policy signature/hash
- Worker checks every 2-4 hours:
  - If now > `offlineLockUntil`, escalate stage.
  - If SIM mismatch, escalate to at least stage 2.
- De-escalation requires signed backend update.

## FCM Command Contract (example)
```json
{
  "type": "LOCK_UPDATE",
  "imei": "356789012345678",
  "stage": 2,
  "reason": "EMI overdue",
  "issuedAt": "2026-02-24T10:15:00.000Z",
  "signature": "base64_signature"
}
```

## Safety & Compliance
- Mandatory consent capture with signed hash at activation.
- Hindi/English lock UI with repayment instructions.
- Emergency call (112) cannot be blocked.
- Audit local lock events and sync back when online.

## Battery & Reliability Targets
- Daily overhead target: <2% battery.
- Unlock latency target: <8 seconds (99p).
- Retry policy:
  - Exponential backoff for sync failures.
  - Immediate priority handling for unlock commands.
