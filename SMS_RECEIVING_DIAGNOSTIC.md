# SMS Receiving - Complete Diagnostic & Solution Guide

## Current System Analysis

### ✅ What's Already Set Up

1. **SMS Route:** `/sms` endpoint is configured
2. **Controller:** `smsController.js` handles incoming SMS
3. **Middleware:** `express.urlencoded` is configured for form data
4. **Logging:** Comprehensive logging is in place
5. **Processing:** STATUS, CANCEL, HELP commands are implemented

### 🔍 Potential Issues

Based on the code analysis, here are the most likely reasons SMS isn't being received:

## Issue 1: No Short Code

**Problem:** You mentioned you don't have a short code yet.

**Impact:** Without a short code, patients can't send SMS to your system.

**Solution:**
1. **For Testing (Sandbox):**
   - Check Africa's Talking dashboard for sandbox short code
   - Usually found in: SMS → Short Codes
   - May be something like `20880` or similar

2. **For Production:**
   - Request a short code through dashboard
   - Fill out application form
   - Wait for approval (1-7 days)

## Issue 2: Callback URL Not Configured

**Problem:** Callback URL might not be set in Africa's Talking dashboard.

**Solution:**
1. Go to: **SMS → SMS Callback URLs → Incoming Messages**
2. Enter: `https://overrigged-michaele-curtate.ngrok-free.dev/sms`
3. Click **Save**
4. Verify it shows as "Active" or "Verified"

## Issue 3: Server Not Accessible

**Problem:** ngrok might not be running or URL changed.

**Check:**
1. Is ngrok running?
2. Is the URL still `https://overrigged-michaele-curtate.ngrok-free.dev`?
3. Can you access the health endpoint? `https://overrigged-michaele-curtate.ngrok-free.dev/health`

**Solution:**
```bash
# Start ngrok
ngrok http 3000

# Update callback URL in dashboard with new URL if changed
```

## Issue 4: Middleware Order Issue

**Problem:** The middleware order in server.js might be causing issues.

**Current Setup:**
```javascript
app.use(express.json());  // Line 28
app.use(express.urlencoded({ extended: true }));  // Line 29
// ...
app.use('/sms', express.urlencoded({ extended: true }), smsRoutes);  // Line 44
```

**Analysis:** This should work, but there's a potential issue - `express.json()` is applied globally before the SMS route. However, the SMS route has its own `urlencoded` middleware, so it should work.

**Potential Fix:** Ensure SMS route is processed before JSON parser tries to parse it.

## Issue 5: Request Format Mismatch

**Problem:** Africa's Talking might be sending data in a different format.

**Solution:** Add more detailed logging to see exactly what's being received.

## Complete Solution

### Step 1: Verify Server is Running

```bash
npm run dev
```

You should see:
```
Server running on port 3000
Reminder scheduler started
```

### Step 2: Verify ngrok is Running

```bash
# In separate terminal
ngrok http 3000
```

Check the URL is: `https://overrigged-michaele-curtate.ngrok-free.dev`

### Step 3: Test the Endpoint Manually

```bash
curl -X POST https://overrigged-michaele-curtate.ngrok-free.dev/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=+250788123456&to=22787&text=STATUS&date=2024-01-15T10:00:00Z&id=TEST123"
```

**Check server logs** - you should see:
```
Incoming SMS received: { from: '+250788123456', ... }
```

### Step 4: Verify Callback URL in Dashboard

1. Log in to Africa's Talking
2. Go to: **SMS → SMS Callback URLs → Incoming Messages**
3. Verify URL is: `https://overrigged-michaele-curtate.ngrok-free.dev/sms`
4. Status should be "Active" or "Verified"

### Step 5: Get/Verify Short Code

1. Check dashboard for sandbox short code
2. Or request production short code
3. Note the short code number

### Step 6: Test with Real SMS

1. Send SMS to your short code: `STATUS`
2. Check server logs immediately
3. Look for "Incoming SMS received" message

## Enhanced Diagnostic Endpoint

Let me add a test endpoint to help diagnose the issue.

