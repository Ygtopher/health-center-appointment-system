# Appointment Confirmation SMS Feature

## Overview

The system now automatically sends detailed SMS to patients when appointments are **confirmed**. This happens when staff changes the appointment status from "scheduled" to "confirmed" in the web dashboard.

## When SMS is Sent

### 1. When Appointment is Created (Initial Booking)
- ✅ **Via USSD:** Patient books via `*384*22787#` → SMS sent immediately
- ✅ **Via Web Dashboard:** Staff creates appointment → SMS sent immediately
- **Status:** Usually "scheduled" at this point

### 2. When Appointment is Confirmed ⭐ NEW
- ✅ **Via Web Dashboard:** Staff changes status to "confirmed" → SMS sent with confirmation
- **This is the new feature you requested!**

### 3. When Patient Requests Status
- ✅ **Via SMS:** Patient sends `STATUS` to `22787` → SMS with details sent

## How It Works

### Confirmation Flow

```
1. Staff opens appointment in web dashboard
   ↓
2. Staff changes status to "confirmed"
   ↓
3. System updates appointment in database
   ↓
4. System detects status changed to "confirmed"
   ↓
5. System fetches full appointment details
   ↓
6. System gets patient phone number and language
   ↓
7. System formats detailed SMS message
   ↓
8. System sends SMS to patient
   ↓
9. Patient receives confirmation SMS with all details
```

## SMS Message Content

### When Status is "Confirmed"

**English:**
```
Appointment Confirmed!

Health Center: Kigali Health Center
Date: 15-01-2024
Time: 10:00
Status: Confirmed
Ref: a1b2c3d4
Reason: Regular checkup
Notes: Patient requested morning appointment

You'll receive a reminder 24h before. Cancel: SMS "CANCEL" or *384*22787#
```

**Kinyarwanda:**
```
Randevu yemejwe neza!

Ihuriro: Ihuriro ry'Ubuzima rya Kigali
Itariki: 15-01-2024
Igihe: 10:00
Imiterere: Yemejwe
Ref: a1b2c3d4
Impamvu: Regular checkup
Inyandiko: Patient requested morning appointment

Uzabona SMS yibuka 24h mbere. Gukuraho: SMS "CANCEL" cyangwa *384*22787#
```

### When Status is "Scheduled" (Initial Booking)

**English:**
```
Appointment Booked!

Health Center: Kigali Health Center
Date: 15-01-2024
Time: 10:00
Status: scheduled
Ref: a1b2c3d4

You'll receive a reminder 24h before. Cancel: SMS "CANCEL" or *384*22787#
```

## What Information is Included

- ✅ **Health Center Name** (bilingual)
- ✅ **Appointment Date** (DD-MM-YYYY)
- ✅ **Appointment Time**
- ✅ **Appointment Status** (Confirmed/Scheduled)
- ✅ **Reference ID** (first 8 characters)
- ✅ **Reason** (if provided)
- ✅ **Notes** (if provided)
- ✅ **Cancel Instructions**

## Testing

### Test 1: Confirm Appointment via Web Dashboard

1. **Log in to web dashboard**
2. **Open an appointment**
3. **Change status to "confirmed"**
4. **Click Save**
5. **Check patient's phone** - should receive SMS
6. **Check server logs** - should see SMS sent

### Test 2: Verify SMS Content

The SMS should:
- Show status as "Confirmed"
- Include all appointment details
- Be in patient's preferred language
- Include cancel instructions

## Configuration

Make sure these are set in `.env`:

```env
SMS_ENABLED=true
AT_API_KEY=your_api_key
AT_USERNAME=sandbox
AT_SENDER_ID=HEALTH_RW
```

## Code Changes

### Files Modified:

1. **`controllers/appointmentController.js`**
   - Added SMS sending in `updateAppointment` method
   - Triggers when status changes to "confirmed"
   - Fetches full appointment details before sending

2. **`services/africasTalking.js`**
   - Enhanced `formatAppointmentDetails` method
   - Different messages for "confirmed" vs "scheduled" status
   - Better formatting for confirmed appointments

## Benefits

1. ✅ **Patient Notification:** Patients know immediately when appointment is confirmed
2. ✅ **Clear Communication:** Detailed information reduces confusion
3. ✅ **Professional:** Automated confirmation improves service quality
4. ✅ **Bilingual:** Works in English and Kinyarwanda
5. ✅ **Complete Details:** All appointment information in one SMS

## Important Notes

1. **SMS is sent automatically** - No manual action needed
2. **Only when status changes to "confirmed"** - Not on other status changes
3. **Requires patient phone number** - Must be in database
4. **Uses patient's language preference** - English or Kinyarwanda
5. **Error handling** - Appointment update won't fail if SMS fails

## Troubleshooting

### Issue: SMS not sent when confirming

**Check:**
1. Is `SMS_ENABLED=true` in `.env`?
2. Does patient have phone number in database?
3. Check server logs for SMS sending errors
4. Verify Africa's Talking credentials

### Issue: Wrong language in SMS

**Check:**
1. Patient's `preferred_language` in database
2. Update if needed: `UPDATE patients SET preferred_language = 'rw' WHERE id = '...'`

### Issue: SMS sent but incomplete

**Check:**
1. Verify appointment has all required fields
2. Check health center name is in database
3. Review server logs for formatting errors

## Summary

✅ **SMS is now sent automatically when appointments are confirmed!**

**Flow:**
1. Staff confirms appointment in dashboard
2. System sends SMS with full details
3. Patient receives confirmation SMS
4. Patient has all appointment information

---

**The system now sends detailed SMS automatically when appointments are confirmed!**

