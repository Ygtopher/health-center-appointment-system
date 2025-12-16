# SMS Not Receiving - Troubleshooting Guide

## Quick Checklist

### 1. Configuration Check ✅

Your configuration looks good:
- ✅ `SMS_ENABLED=true`
- ✅ `AT_API_KEY` is set
- ✅ `AT_USERNAME=sandbox`

### 2. Common Issues and Solutions

#### Issue 1: Sandbox Limitations

**Problem:** In sandbox, you can ONLY send SMS to verified/test phone numbers.

**Solution:**
1. Go to Africa's Talking dashboard
2. Navigate to **"SMS"** → **"Test Numbers"** or **"Verified Numbers"**
3. Add and verify your phone number
4. Only verified numbers can receive SMS in sandbox

**Check:**
- Is your phone number verified in the dashboard?
- Are you trying to send to a verified number?

#### Issue 2: Server Not Running

**Problem:** Server must be running for SMS to be sent.

**Solution:**
```bash
npm run dev
```

**Check:**
- Is your server running?
- Do you see "Reminder scheduler started" in logs?

#### Issue 3: Phone Number Format

**Problem:** Phone number must be in correct format.

**Solution:**
- Must include country code: `+250788123456` (Rwanda)
- Must start with `+`
- No spaces or dashes

**Check:**
- Is phone number in database correct?
- Does it start with `+`?

#### Issue 4: SMS Sending Fails Silently

**Problem:** SMS might be failing but not showing errors.

**Solution:**
1. Check server logs: `logs/combined.log` or `logs/error.log`
2. Look for "SMS sent successfully" or "SMS sending error"
3. Run test script: `node test-sms.js`

#### Issue 5: Account Has No Credit (Production)

**Problem:** Production accounts need credit to send SMS.

**Solution:**
1. Go to Africa's Talking dashboard
2. Check account balance
3. Add credit if needed

**Check:**
- Are you using sandbox (free) or production (paid)?
- Does your account have credit?

## Step-by-Step Diagnosis

### Step 1: Test SMS Sending Directly

Run the test script:
```bash
node test-sms.js
```

This will:
- Check your configuration
- Test sending an SMS
- Show detailed results

### Step 2: Check Server Logs

Look for SMS-related messages:

**Success:**
```
SMS sent successfully { phoneNumber: '+250...', response: {...} }
```

**Error:**
```
SMS sending error { phoneNumber: '+250...', error: '...' }
```

**Location:**
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- Console output (if running with `npm run dev`)

### Step 3: Verify Phone Number in Database

Check if patient has correct phone number:

```sql
SELECT id, phone_number, preferred_language 
FROM patients 
WHERE id = 'patient_id_here';
```

**Requirements:**
- Phone number must exist
- Must be in format: `+250788123456`
- Must be a verified number (for sandbox)

### Step 4: Test Appointment Booking

1. **Book an appointment via USSD:**
   - Dial: `*384*22787#`
   - Book appointment
   - Check server logs for SMS sending

2. **Book an appointment via web:**
   - Create appointment in dashboard
   - Check server logs for SMS sending

3. **Check logs:**
   - Look for "SMS sent successfully"
   - Look for any errors

### Step 5: Verify Africa's Talking Account

1. **Log in to dashboard:**
   - https://account.africastalking.com

2. **Check:**
   - Is account active?
   - Are credentials correct?
   - Is it sandbox or production?
   - Are there any restrictions?

## Testing Scenarios

### Test 1: Direct SMS Test

```bash
node test-sms.js
```

Enter your phone number and see if SMS is sent.

### Test 2: Book Appointment and Check Logs

1. Book an appointment
2. Immediately check server logs
3. Look for SMS sending attempt

### Test 3: Check Reminder Scheduler

The reminder scheduler runs every 5 minutes. Check if it's:
- Running (should see "Reminder scheduler started" on server start)
- Processing reminders (check logs every 5 minutes)

## Debugging Commands

### Check Environment Variables

```bash
node -e "require('dotenv').config(); console.log('SMS_ENABLED:', process.env.SMS_ENABLED); console.log('AT_USERNAME:', process.env.AT_USERNAME);"
```

### Check Logs

```bash
# Windows
type logs\combined.log | findstr "SMS"
type logs\error.log | findstr "SMS"

# Linux/Mac
grep -i "sms" logs/combined.log
grep -i "sms" logs/error.log
```

### Test SMS Service Directly

```javascript
const service = require('./services/africasTalking');
service.sendSMS('+250788123456', 'Test message')
  .then(result => console.log('Result:', result))
  .catch(error => console.error('Error:', error));
```

## Common Error Messages

### "SMS service not configured"
- **Cause:** API credentials missing
- **Fix:** Check `.env` file has `AT_API_KEY` and `AT_USERNAME`

### "Invalid API key"
- **Cause:** Wrong API key
- **Fix:** Verify API key in Africa's Talking dashboard

### "Invalid phone number"
- **Cause:** Phone number format incorrect
- **Fix:** Use format: `+250788123456`

### "Insufficient credit"
- **Cause:** No credit in account (production)
- **Fix:** Add credit to Africa's Talking account

### "Number not verified" (Sandbox)
- **Cause:** Phone number not in verified list
- **Fix:** Add number to verified list in dashboard

## Quick Fixes

### Fix 1: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Fix 2: Verify Phone Number

1. Go to Africa's Talking dashboard
2. Add your phone number to verified list
3. Verify it (usually via SMS code)

### Fix 3: Check .env File

Make sure `.env` has:
```env
SMS_ENABLED=true
AT_API_KEY=your_actual_key
AT_USERNAME=sandbox
AT_SENDER_ID=HEALTH_RW
```

### Fix 4: Check Database

Verify patient has phone number:
```sql
UPDATE patients 
SET phone_number = '+250788123456' 
WHERE id = 'patient_id';
```

## Still Not Working?

### Check These:

1. ✅ Server is running
2. ✅ Environment variables are set
3. ✅ Phone number is verified (sandbox)
4. ✅ Phone number format is correct
5. ✅ Server logs show SMS attempts
6. ✅ Africa's Talking account is active
7. ✅ No firewall blocking requests

### Get More Help:

1. **Check server logs** for detailed error messages
2. **Run test script:** `node test-sms.js`
3. **Check Africa's Talking dashboard** for delivery reports
4. **Contact support** with error messages from logs

## Next Steps

1. **Run the test script:**
   ```bash
   node test-sms.js
   ```

2. **Check server logs** after booking appointment

3. **Verify phone number** in Africa's Talking dashboard

4. **Test with verified number** (sandbox requirement)

---

**Most Common Issue:** In sandbox, you can only send to verified phone numbers. Make sure your number is verified in the Africa's Talking dashboard!

