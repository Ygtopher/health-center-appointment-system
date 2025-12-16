# Complete Guide: Setting Up SMS in Africa's Talking

This guide will walk you through setting up SMS receiving in your Africa's Talking account step by step.

## Prerequisites

- ✅ Africa's Talking account created
- ✅ Application created in Africa's Talking dashboard
- ✅ API credentials (API Key and Username) ready
- ✅ Your ngrok URL: `https://overrigged-michaele-curtate.ngrok-free.dev`
- ✅ Your server running locally

## Step 1: Log In to Africa's Talking Dashboard

1. **Go to Africa's Talking Dashboard:**
   - Open your browser
   - Navigate to: **https://account.africastalking.com**
   - Log in with your credentials

2. **Navigate to Your Application:**
   - Once logged in, you'll see the dashboard
   - Click on **"Applications"** or **"Apps"** in the left sidebar
   - Select your application (the one you created earlier)

## Step 2: Access SMS Settings

1. **In your application dashboard:**
   - Look for **"SMS"** in the left menu
   - Click on **"SMS"** to open SMS settings

2. **You should see:**
   - SMS settings page
   - Options for sending SMS
   - **Callback URL** or **Incoming SMS** section

## Step 3: Configure Callback URL for Incoming SMS

1. **Find the Callback URL Section:**
   - Look for **"Callback URL"**, **"Incoming SMS URL"**, or **"Webhook URL"**
   - This might be under:
     - **"Settings"** tab
     - **"Incoming SMS"** section
     - **"Webhooks"** section
     - **"Configuration"** section

2. **Enter Your Callback URL:**
   ```
   https://overrigged-michaele-curtate.ngrok-free.dev/sms
   ```
   
   **Important:** 
   - Must start with `https://` (not `http://`)
   - Must include `/sms` at the end
   - No trailing slash

3. **Save the Configuration:**
   - Click **"Save"**, **"Update"**, or **"Submit"** button
   - Africa's Talking will verify the URL is accessible
   - You should see a success message

## Step 4: Set Up Short Code (If Needed)

### Option A: Using Sandbox Short Code (Testing)

1. **In Sandbox Environment:**
   - Africa's Talking provides a test short code
   - Usually something like `20880` or similar
   - Check your dashboard for the sandbox short code

2. **Use the Sandbox Short Code:**
   - Patients can send SMS to this number
   - Only works with verified/test numbers in sandbox

### Option B: Request a Short Code (Production)

1. **For Production:**
   - Go to **"Short Codes"** section in dashboard
   - Click **"Request Short Code"**
   - Fill in the application form:
     - Purpose: "Health center appointment system"
     - Expected volume: Your estimated SMS volume
     - Use case: "Patient appointment management"
   - Submit the request
   - Wait for approval (can take a few days)

2. **Once Approved:**
   - You'll receive your short code
   - Update your system documentation
   - Start using it for production

## Step 5: Verify Your Configuration

### Check Your Settings:

1. **Callback URL:**
   - ✅ Should be: `https://overrigged-michaele-curtate.ngrok-free.dev/sms`
   - ✅ Status should show as "Active" or "Verified"

2. **Short Code:**
   - ✅ Note your short code number
   - ✅ Status should be "Active"

3. **API Credentials:**
   - ✅ API Key is set in your `.env` file
   - ✅ Username is set in your `.env` file

## Step 6: Test the Setup

### Test 1: Verify Endpoint is Accessible

1. **Make sure your server is running:**
   ```bash
   npm run dev
   ```

2. **Make sure ngrok is running:**
   - Your ngrok should be forwarding to port 3000
   - URL should be: `https://overrigged-michaele-curtate.ngrok-free.dev`

3. **Test the endpoint manually:**
   - Open browser or use Postman
   - Send POST request to: `https://overrigged-michaele-curtate.ngrok-free.dev/sms`
   - Check server logs for the request

### Test 2: Send Test SMS

1. **From a phone (sandbox - must be verified number):**
   - Send SMS to your short code
   - Message: `STATUS` or `HELP`
   - Wait for response

2. **Check Server Logs:**
   ```bash
   # In your server terminal, you should see:
   Incoming SMS received: { from: '+250...', to: '...', text: 'STATUS', ... }
   ```

3. **Verify Response:**
   - Patient should receive a response SMS
   - Check the response content

## Step 7: Update Your .env File

Make sure your `.env` file has these settings:

```env
# Africa's Talking API Configuration
AT_API_KEY=your_api_key_here
AT_USERNAME=sandbox
AT_SENDER_ID=HEALTH_RW

# SMS Configuration
SMS_ENABLED=true
APPOINTMENT_REMINDER_HOURS=24
MEDICATION_REMINDER_MINUTES=30
```

## Common Issues and Solutions

### Issue 1: "Callback URL not accessible"

**Symptoms:**
- Error when saving callback URL
- URL verification fails

**Solutions:**
1. ✅ Make sure your server is running
2. ✅ Make sure ngrok is running
3. ✅ Verify the URL is correct (https://, includes /sms)
4. ✅ Check if ngrok shows browser verification (may need to visit URL in browser first)
5. ✅ Try accessing the URL directly in browser

### Issue 2: "SMS not being received"

**Symptoms:**
- SMS sent but not received by server
- No logs in server

**Solutions:**
1. ✅ Verify callback URL is saved correctly
2. ✅ Check server logs for errors
3. ✅ Make sure ngrok is still running (URL might have changed)
4. ✅ Verify short code is active
5. ✅ In sandbox, make sure phone number is verified

### Issue 3: "ngrok URL changed"

**Symptoms:**
- ngrok shows different URL
- Callbacks stop working

**Solutions:**
1. ✅ Restart ngrok and get new URL
2. ✅ Update callback URL in Africa's Talking dashboard
3. ✅ Consider ngrok paid plan for static domain

### Issue 4: "Response SMS not sent"

**Symptoms:**
- SMS received but no response

**Solutions:**
1. ✅ Check `SMS_ENABLED=true` in `.env`
2. ✅ Verify API credentials are correct
3. ✅ Check server logs for SMS sending errors
4. ✅ Verify account has credit (for production)
5. ✅ Check if patient exists in database

## Dashboard Navigation Guide

### Where to Find Settings:

1. **Callback URL:**
   - Dashboard → Applications → Your App → SMS → Settings
   - OR: Dashboard → SMS → Incoming SMS → Callback URL

2. **Short Code:**
   - Dashboard → Applications → Your App → Short Codes
   - OR: Dashboard → SMS → Short Codes

3. **API Credentials:**
   - Dashboard → Applications → Your App → Settings
   - OR: Dashboard → Settings → API Keys

## Testing Checklist

Before going live, verify:

- [ ] Callback URL configured and verified
- [ ] Short code is active
- [ ] Server is running and accessible
- [ ] ngrok is running (for local testing)
- [ ] Test SMS sent and received
- [ ] Server logs show incoming SMS
- [ ] Response SMS sent back to patient
- [ ] All commands work (STATUS, CANCEL, HELP)
- [ ] Works in both English and Kinyarwanda

## Production Checklist

When ready for production:

- [ ] Switch to production API credentials
- [ ] Deploy server to permanent hosting
- [ ] Get permanent domain name
- [ ] Set up SSL certificate (HTTPS)
- [ ] Update callback URL to production domain
- [ ] Request and get approved short code
- [ ] Add credit to Africa's Talking account
- [ ] Test thoroughly with real numbers
- [ ] Monitor SMS delivery and costs

## Your Current Configuration Summary

```
Callback URL: https://overrigged-michaele-curtate.ngrok-free.dev/sms
Environment: Development (Sandbox)
Server: Local (via ngrok)
Status: Ready for testing
```

## Next Steps

1. ✅ **Configure callback URL** in Africa's Talking dashboard
2. ✅ **Test with a verified phone number** (sandbox)
3. ✅ **Verify all commands work** (STATUS, CANCEL, HELP)
4. ✅ **Check server logs** for any errors
5. ✅ **When ready, deploy to production** with permanent domain

## Support Resources

- **Africa's Talking Documentation:** https://developers.africastalking.com
- **SMS API Reference:** https://developers.africastalking.com/docs/sms
- **Dashboard Help:** Check help section in your dashboard
- **Support:** Contact support through dashboard or email

---

## Quick Reference

**Your SMS Endpoint:**
```
https://overrigged-michaele-curtate.ngrok-free.dev/sms
```

**Available Commands:**
- `STATUS` / `REBA` - Check appointment
- `CANCEL` / `KURAHO` - Cancel appointment  
- `HELP` / `UBUFASHA` - Get help

**Dashboard URL:**
```
https://account.africastalking.com
```

---

**Note:** Remember that ngrok free URLs change when you restart ngrok. For production, use a permanent domain name and hosting service.

