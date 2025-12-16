# Appointment Details SMS Feature

## Overview

The system now sends detailed appointment information via SMS in two scenarios:
1. **When an appointment is booked** - Automatic confirmation SMS with all details
2. **When patient requests STATUS** - Detailed appointment information via SMS

## What Information is Sent

### Appointment Details Include:

- ✅ **Health Center Name** (in patient's preferred language)
- ✅ **Appointment Date** (DD-MM-YYYY format)
- ✅ **Appointment Time**
- ✅ **Appointment Status** (scheduled, confirmed, etc.)
- ✅ **Appointment Reference ID** (first 8 characters)
- ✅ **Reason** (if provided)
- ✅ **Notes** (if provided)
- ✅ **Instructions** on how to cancel

### Example SMS (English):

```
Appointment Confirmed!

Health Center: Kigali Health Center
Date: 15-01-2024
Time: 10:00
Status: scheduled
Ref: a1b2c3d4
Reason: Regular checkup
Notes: Patient requested morning appointment

You'll receive a reminder 24h before. Cancel: SMS "CANCEL" or *384*22787#
```

### Example SMS (Kinyarwanda):

```
Randevu yagenwe neza!

Ihuriro: Ihuriro ry'Ubuzima rya Kigali
Itariki: 15-01-2024
Igihe: 10:00
Imiterere: scheduled
Ref: a1b2c3d4

Uzabona SMS yibuka 24h mbere. Gukuraho: SMS "CANCEL" cyangwa *384*22787#
```

## When SMS is Sent

### 1. Automatic Confirmation (When Booking)

**Via USSD:**
- Patient books appointment via USSD (*384*22787#)
- System automatically sends confirmation SMS with details

**Via Web Dashboard:**
- Staff creates appointment in web dashboard
- System automatically sends confirmation SMS to patient

### 2. On Request (STATUS Command)

**Via SMS:**
- Patient sends SMS: `STATUS` or `REBA` or `IMITERERE`
- System responds with detailed appointment information

## How It Works

### 1. Appointment Booking Flow

```
1. Appointment Created
   ↓
2. System fetches full appointment details
   ↓
3. System gets patient phone number and language preference
   ↓
4. System formats detailed SMS message
   ↓
5. System sends SMS to patient
   ↓
6. Patient receives detailed appointment information
```

### 2. STATUS Request Flow

```
1. Patient sends SMS: "STATUS"
   ↓
2. System identifies patient by phone number
   ↓
3. System fetches next appointment
   ↓
4. System formats detailed SMS message
   ↓
5. System sends SMS to patient
   ↓
6. Patient receives detailed appointment information
```

## Language Support

The SMS automatically uses the patient's preferred language:
- **English** - Default
- **Kinyarwanda** - If patient's `preferred_language` is set to `'rw'`

## Configuration

Make sure these are set in your `.env` file:

```env
# Enable SMS
SMS_ENABLED=true

# Africa's Talking credentials
AT_API_KEY=your_api_key
AT_USERNAME=sandbox
AT_SENDER_ID=HEALTH_RW
```

## Testing

### Test 1: Book Appointment via USSD

1. Dial: `*384*22787#`
2. Book an appointment
3. Check your phone - you should receive detailed SMS

### Test 2: Book Appointment via Web

1. Log in to web dashboard
2. Create an appointment for a patient
3. Patient should receive detailed SMS

### Test 3: Request STATUS via SMS

1. Send SMS to your short code: `STATUS`
2. You should receive detailed appointment information

## SMS Format Details

### Included Information:

- **Health Center:** Full name (bilingual)
- **Date:** Formatted as DD-MM-YYYY
- **Time:** 24-hour format (HH:MM)
- **Status:** Current appointment status
- **Reference ID:** First 8 characters of appointment ID
- **Reason:** Appointment reason (if provided)
- **Notes:** Additional notes (if provided)
- **Cancel Instructions:** How to cancel appointment

### Message Length:

- Messages are optimized to fit in standard SMS (160 characters)
- Long messages may be split automatically by carrier
- All essential information is included

## Benefits

1. ✅ **Patient Awareness:** Patients know exactly when and where their appointment is
2. ✅ **Reduced No-Shows:** Clear information helps patients remember appointments
3. ✅ **Easy Access:** Patients can request details anytime via SMS
4. ✅ **Bilingual Support:** Works in English and Kinyarwanda
5. ✅ **Automatic:** No manual intervention needed

## Troubleshooting

### Issue: SMS not received after booking

**Check:**
1. Is `SMS_ENABLED=true` in `.env`?
2. Are Africa's Talking credentials correct?
3. Does patient have a valid phone number in database?
4. Check server logs for SMS sending errors

### Issue: SMS received but incomplete

**Check:**
1. Verify appointment has all required fields
2. Check if health center name is in database
3. Review server logs for formatting errors

### Issue: Wrong language in SMS

**Check:**
1. Verify patient's `preferred_language` in database
2. Default is English if not set
3. Update patient record if needed

## Code Changes Made

### Files Modified:

1. **`services/africasTalking.js`**
   - Added `formatAppointmentDetails()` method
   - Added `sendAppointmentConfirmation()` method

2. **`controllers/ussdController.js`**
   - Enhanced to send confirmation SMS after USSD booking
   - Fetches full appointment details before sending

3. **`controllers/appointmentController.js`**
   - Enhanced to send confirmation SMS after web booking
   - Includes error handling for SMS failures

4. **`controllers/smsController.js`**
   - Enhanced STATUS command to send detailed information
   - Uses new formatting method

## Future Enhancements

Possible additions:
- Multiple appointments in one SMS
- Appointment history
- Reschedule via SMS
- Directions to health center
- Doctor/staff name in SMS

---

**The system now provides comprehensive appointment details via SMS automatically!**

