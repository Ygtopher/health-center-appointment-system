# Short Code 22787 - Complete Setup Guide

## Your Short Code Information

**Short Code:** `22787`  
**Callback URL:** `https://overrigged-michaele-curtate.ngrok-free.dev/sms`

## Quick Setup Steps

### Step 1: Configure Callback URL in Dashboard

1. **Log in to Africa's Talking Dashboard:**
   - Go to: https://account.africastalking.com

2. **Navigate to SMS Callback URLs:**
   - Click: **SMS** → **SMS Callback URLs** → **Incoming Messages**

3. **Enter Your Callback URL:**
   ```
   https://overrigged-michaele-curtate.ngrok-free.dev/sms
   ```

4. **Click Save**
   - Status should show "Active" or "Verified"

### Step 2: Verify Server is Running

```bash
npm run dev
```

You should see:
```
Server running on port 3000
Reminder scheduler started
```

### Step 3: Verify ngrok is Running

```bash
# In separate terminal
ngrok http 3000
```

Make sure the URL is: `https://overrigged-michaele-curtate.ngrok-free.dev`

### Step 4: Test the Setup

**Test 1: Check Endpoint**
```bash
curl https://overrigged-michaele-curtate.ngrok-free.dev/sms/test
```

**Test 2: Simulate SMS**
```bash
curl -X POST https://overrigged-michaele-curtate.ngrok-free.dev/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=+250788123456&to=22787&text=STATUS&id=TEST123"
```

**Test 3: Send Real SMS**
- From your phone, send: `STATUS` to `22787`
- Check server logs immediately
- You should see: `"Incoming SMS received"`

## How Patients Use It

### Available Commands

Patients can send these SMS to **22787**:

| Command | English | Kinyarwanda | Action |
|---------|---------|------------|--------|
| Check Status | `STATUS` | `REBA` or `IMITERERE` | Get appointment details |
| Cancel | `CANCEL` | `KURAHO` or `GUKURAHO` | Cancel appointment |
| Help | `HELP` | `UBUFASHA` or `FASHA` | Get help message |

### Example Usage

1. **Patient sends:** `STATUS` to `22787`
2. **System responds:** Detailed appointment information
3. **Patient receives:** SMS with appointment details

## Testing Checklist

- [ ] Callback URL configured in dashboard
- [ ] Server is running (`npm run dev`)
- [ ] ngrok is running
- [ ] Test endpoint works (`/sms/test`)
- [ ] Simulated SMS works (curl command)
- [ ] Real SMS test (send STATUS to 22787)
- [ ] Server logs show incoming SMS

## Troubleshooting

### Issue: SMS not received

**Check:**
1. Is callback URL saved? (SMS → SMS Callback URLs → Incoming Messages)
2. Is server running?
3. Is ngrok running?
4. Check server logs for incoming requests

**Test:**
```bash
# Test endpoint manually
curl -X POST https://overrigged-michaele-curtate.ngrok-free.dev/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=+250788123456&to=22787&text=TEST&id=TEST123"
```

### Issue: No response to SMS

**Check:**
1. Is patient in database? (must have phone number)
2. Check server logs for errors
3. Verify SMS sending is enabled (`SMS_ENABLED=true`)
4. Check Africa's Talking credentials

## Your Configuration Summary

```
Short Code: 22787
Callback URL: https://overrigged-michaele-curtate.ngrok-free.dev/sms
Server Port: 3000
Environment: Development (via ngrok)
```

## Next Steps

1. ✅ **Configure callback URL** in dashboard
2. ✅ **Test endpoint** with curl
3. ✅ **Send test SMS** to 22787
4. ✅ **Verify it works** - check logs

---

**You're all set! Just configure the callback URL and test it!**

