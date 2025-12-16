# Where to Put Your SMS Callback URL in Africa's Talking

## Step-by-Step Instructions

### Step 1: Click on "Incoming Messages"

In your Africa's Talking SMS settings, you should see these options:
- Delivery Reports
- **Incoming Messages** ← Click this one!
- Bulk SMS Opt Out
- Subscription Notifications

**Click on "Incoming Messages"**

### Step 2: Enter Your Callback URL

Once you're in the "Incoming Messages" section, you should see a field for:
- **Callback URL** or
- **Webhook URL** or
- **Incoming SMS URL**

Enter this URL:
```
https://overrigged-michaele-curtate.ngrok-free.dev/sms
```

### Step 3: Save the Configuration

- Click **"Save"**, **"Update"**, or **"Submit"** button
- Africa's Talking will verify the URL
- You should see a success message or checkmark

## Visual Guide

```
SMS Settings
├── Delivery Reports
├── Incoming Messages  ← CLICK HERE
│   └── Callback URL: [Enter your URL here]
├── Bulk SMS Opt Out
└── Subscription Notifications
```

## Your Exact URL to Enter

```
https://overrigged-michaele-curtate.ngrok-free.dev/sms
```

**Important:**
- ✅ Must start with `https://`
- ✅ Must include `/sms` at the end
- ✅ No spaces before or after
- ✅ No trailing slash

## What Happens Next

1. **After Saving:**
   - Africa's Talking will test the URL
   - You should see a verification status
   - Status should show "Active" or "Verified"

2. **Testing:**
   - Send an SMS to your short code
   - Your server should receive it at `/sms` endpoint
   - Check server logs to confirm

## Troubleshooting

### If you don't see "Incoming Messages" option:

1. **Check your account type:**
   - Make sure you're in the correct application
   - Some features may be in different locations

2. **Alternative locations:**
   - Look for "Webhooks" section
   - Check "Settings" → "SMS Settings"
   - Look for "Incoming SMS" in main menu

### If URL verification fails:

1. **Make sure your server is running:**
   ```bash
   npm run dev
   ```

2. **Make sure ngrok is running:**
   - Check ngrok terminal
   - URL should be active

3. **Try accessing URL in browser:**
   - Open: `https://overrigged-michaele-curtate.ngrok-free.dev/sms`
   - If ngrok shows verification page, complete it first
   - Then try saving in Africa's Talking again

## Quick Checklist

- [ ] Clicked on "Incoming Messages"
- [ ] Entered callback URL: `https://overrigged-michaele-curtate.ngrok-free.dev/sms`
- [ ] Clicked Save/Update
- [ ] Saw success/verification message
- [ ] Server is running
- [ ] ngrok is running
- [ ] Ready to test!

## Next Steps After Configuration

1. **Test the setup:**
   - Send SMS to your short code: `STATUS` or `HELP`
   - Check server logs for incoming SMS

2. **Verify it works:**
   - Server logs should show: `Incoming SMS received: ...`
   - Patient should receive response SMS

3. **Monitor:**
   - Check logs regularly
   - Monitor for any errors

---

**Remember:** The callback URL goes in the **"Incoming Messages"** section, not in Delivery Reports or other sections.

