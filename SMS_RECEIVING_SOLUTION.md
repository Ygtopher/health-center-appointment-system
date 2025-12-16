# Complete Solution: How to Receive SMS

## Problem Analysis

From the logs and code review, I found:

1. ✅ **Server is running** - Logs show server is active
2. ✅ **SMS endpoint is configured** - `/sms` route exists
3. ❌ **No incoming SMS logs** - Endpoint is not being called
4. ❌ **No short code** - You don't have a short code yet
5. ⚠️ **SMS sending errors** - Authentication issues (401 errors)

## Root Cause

**The main issue: You need a short code to receive SMS.**

Without a short code, patients have nowhere to send SMS messages. The callback URL is ready, but there's no number for patients to text.

## Complete Solution

### Step 1: Get a Short Code (CRITICAL)

**Option A: Check for Sandbox Short Code**

1. Log in to Africa's Talking dashboard
2. Go to **SMS → Short Codes**
3. Look for any number listed (e.g., `20880`, `22787`, etc.)
4. **This is your short code for testing**

**Option B: Request Production Short Code**

1. In dashboard: **SMS → Short Codes → Request Short Code**
2. Fill application:
   - Purpose: "Health center appointment management"
   - Use Case: "Patients send SMS commands (STATUS, CANCEL, HELP)"
   - Country: Rwanda
3. Submit and wait for approval

### Step 2: Configure Callback URL

1. Go to: **SMS → SMS Callback URLs → Incoming Messages**
2. Enter: `https://overrigged-michaele-curtate.ngrok-free.dev/sms`
3. Click **Save**
4. Verify status shows "Active" or "Verified"

### Step 3: Verify Server is Accessible

Test if your endpoint is reachable:

```bash
# Test 1: Health check
curl https://overrigged-michaele-curtate.ngrok-free.dev/health

# Test 2: SMS endpoint info
curl https://overrigged-michaele-curtate.ngrok-free.dev/sms/test

# Test 3: Simulate SMS
curl -X POST https://overrigged-michaele-curtate.ngrok-free.dev/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=+250788123456&to=22787&text=STATUS&date=2024-01-15T10:00:00Z&id=TEST123"
```

**Check server logs** - you should see the request logged.

### Step 4: Test with Real SMS

Once you have a short code:

1. **Send SMS to short code:** `STATUS` or `HELP`
2. **Check server logs immediately:**
   ```bash
   # Windows
   type logs\combined.log | findstr "SMS"
   
   # Or check console output
   ```
3. **Look for:** `"Incoming SMS received"` or `"SMS endpoint hit"`

## Enhanced Debugging

I've added enhanced logging to help diagnose:

### New Test Endpoints

1. **GET `/sms/test`** - Check if endpoint is accessible
2. **POST `/sms/test`** - Test endpoint with sample data

### Enhanced Logging

The SMS controller now logs:
- Raw request data
- Headers
- Body content
- Any errors

## Common Issues & Fixes

### Issue 1: "No short code"

**Symptom:** Can't receive SMS because there's no number to send to.

**Fix:**
- Get sandbox short code from dashboard
- Or request production short code
- **This is required for SMS receiving**

### Issue 2: "Callback URL not working"

**Symptom:** SMS sent but not received by server.

**Check:**
1. Is callback URL saved in dashboard?
2. Is ngrok running?
3. Is server running?
4. Test endpoint manually with curl

**Fix:**
- Verify callback URL is correct
- Restart ngrok if needed
- Update callback URL if ngrok URL changed

### Issue 3: "SMS sending fails (401 error)"

**Symptom:** Logs show "Request failed with status code 401"

**Fix:**
1. Check `.env` file:
   ```env
   AT_API_KEY=your_actual_key_here
   AT_USERNAME=sandbox
   ```
2. Verify credentials in Africa's Talking dashboard
3. Make sure no extra spaces or quotes
4. Restart server after changing `.env`

### Issue 4: "Endpoint not receiving requests"

**Symptom:** No logs when SMS is sent.

**Check:**
1. Test endpoint manually: `curl -X POST https://your-url/sms/test ...`
2. Check if ngrok is running
3. Check if server is running
4. Check firewall/network settings

## Step-by-Step Testing

### Test 1: Verify Endpoint is Working

```bash
# In browser or curl
https://overrigged-michaele-curtate.ngrok-free.dev/sms/test
```

Should return JSON with endpoint info.

### Test 2: Simulate SMS Request

```bash
curl -X POST https://overrigged-michaele-curtate.ngrok-free.dev/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=+250788123456&to=22787&text=STATUS&id=TEST123"
```

**Check server console** - should see:
```
SMS endpoint hit - Raw request: { ... }
Incoming SMS received: { from: '+250788123456', ... }
```

### Test 3: Real SMS (After Getting Short Code)

1. Send SMS: `STATUS` to your short code
2. Immediately check server logs
3. Should see incoming SMS logged

## What to Check Right Now

### 1. Do You Have a Short Code?

- [ ] Check dashboard: SMS → Short Codes
- [ ] If yes, note the number
- [ ] If no, request one

### 2. Is Callback URL Configured?

- [ ] Go to: SMS → SMS Callback URLs → Incoming Messages
- [ ] URL is: `https://overrigged-michaele-curtate.ngrok-free.dev/sms`
- [ ] Status is "Active" or "Verified"

### 3. Is Server Running?

- [ ] Run: `npm run dev`
- [ ] See: "Server running on port 3000"
- [ ] See: "Reminder scheduler started"

### 4. Is ngrok Running?

- [ ] Run: `ngrok http 3000`
- [ ] URL matches: `https://overrigged-michaele-curtate.ngrok-free.dev`
- [ ] Status shows "online"

### 5. Test Endpoint Manually

- [ ] Run test curl command above
- [ ] Check server logs for request
- [ ] Verify endpoint responds

## Quick Diagnostic Commands

```bash
# 1. Check if server is running
npm run dev

# 2. Test endpoint
curl https://overrigged-michaele-curtate.ngrok-free.dev/sms/test

# 3. Simulate SMS
curl -X POST https://overrigged-michaele-curtate.ngrok-free.dev/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=+250788123456&to=22787&text=TEST&id=TEST123"

# 4. Check logs
type logs\combined.log | findstr "SMS"
```

## Expected Flow When Working

1. **Patient sends SMS** to short code (e.g., `STATUS` to `22787`)
2. **Africa's Talking receives** SMS
3. **Africa's Talking forwards** to your callback URL
4. **Your server receives** POST request at `/sms`
5. **Server logs:** `"SMS endpoint hit"` and `"Incoming SMS received"`
6. **Server processes** SMS (STATUS, CANCEL, HELP)
7. **Server sends** response SMS back to patient
8. **Patient receives** response

## Most Likely Issue

**You don't have a short code yet.**

This is the #1 reason SMS receiving doesn't work. You need:
1. A short code number (from dashboard or request one)
2. Patients send SMS to that number
3. Africa's Talking forwards to your callback URL

## Next Steps

1. **Get short code** (check dashboard or request)
2. **Configure callback URL** (if not done)
3. **Test endpoint** manually with curl
4. **Send test SMS** to short code
5. **Check logs** for incoming SMS

---

**The system is ready - you just need a short code to receive SMS!**

