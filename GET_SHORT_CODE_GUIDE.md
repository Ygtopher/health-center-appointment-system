# How to Get a Short Code for SMS Receiving

## Understanding Short Codes

A **short code** is a special phone number (usually 3-6 digits) that people can send SMS to. You need one to receive incoming SMS messages.

## Option 1: Use Sandbox Short Code (For Testing - FREE)

### Step 1: Check Your Sandbox Short Code

1. **Log in to Africa's Talking Dashboard:**
   - Go to: https://account.africastalking.com
   - Make sure you're in **Sandbox** environment

2. **Find Your Sandbox Short Code:**
   - Go to **"SMS"** → **"Short Codes"** or
   - Go to **"Applications"** → Your App → **"Short Codes"**
   - Look for a number like `20880` or similar
   - This is your **sandbox short code** (usually provided automatically)

3. **Note the Short Code:**
   - Write it down
   - You'll use this for testing

### Step 2: Verify Test Phone Numbers

**Important:** In sandbox, you can only receive SMS from:
- Phone numbers you've verified in your account
- Test numbers provided by Africa's Talking

**To verify a phone number:**
1. Go to **"SMS"** → **"Test Numbers"** or **"Verified Numbers"**
2. Add your phone number
3. Verify it (usually via SMS code)
4. Now you can send SMS to your short code from that number

## Option 2: Request a Production Short Code (For Real Use)

### Step 1: Request Short Code

1. **In Africa's Talking Dashboard:**
   - Go to **"SMS"** → **"Short Codes"**
   - Click **"Request Short Code"** or **"Apply for Short Code"**

2. **Fill Out the Application Form:**
   - **Purpose:** "Health center appointment management system"
   - **Use Case:** "Patients send SMS commands (STATUS, CANCEL, HELP) to check/cancel appointments"
   - **Expected Volume:** Estimate your monthly SMS volume
   - **Service Description:** "Two-way SMS service for appointment management"
   - **Country:** Rwanda

3. **Submit the Application:**
   - Review all information
   - Submit the form
   - Wait for approval (can take 1-7 business days)

### Step 2: Wait for Approval

- Africa's Talking will review your application
- You'll receive email notification when approved
- Once approved, you'll get your short code number

### Step 3: Activate Your Short Code

1. **After Approval:**
   - Go to **"Short Codes"** in dashboard
   - Find your approved short code
   - Click **"Activate"** or **"Enable"**

2. **Configure:**
   - Make sure callback URL is set (in "Incoming Messages")
   - Test with a real phone number

## Option 3: Use a Virtual Mobile Number (Alternative)

Some providers offer virtual mobile numbers that can receive SMS. Check if Africa's Talking offers this in your region.

## What to Do Right Now

### For Testing (Sandbox):

1. **Check if you have a sandbox short code:**
   - Log in to dashboard
   - Go to SMS → Short Codes
   - Look for any number listed

2. **If you see a short code:**
   - ✅ Use it for testing
   - ✅ Verify your test phone number
   - ✅ Test sending SMS to it

3. **If you don't see a short code:**
   - Contact Africa's Talking support
   - Ask for sandbox short code access
   - They usually provide one for testing

### For Production:

1. **Request a short code:**
   - Follow Option 2 above
   - Fill out the application
   - Wait for approval

2. **While waiting:**
   - Continue testing in sandbox
   - Set up your callback URL (you can do this now)
   - Test the system thoroughly

## Quick Setup Steps

### Step 1: Set Up Callback URL (Do This Now)

Even without a short code, you can set up the callback URL:

1. Go to **"SMS"** → **"Incoming Messages"**
2. Enter callback URL: `https://overrigged-michaele-curtate.ngrok-free.dev/sms`
3. Click **"Save"**

This way, when you get your short code, everything will be ready!

### Step 2: Get Your Short Code

**For Testing:**
- Use sandbox short code (check dashboard)
- Verify test phone numbers

**For Production:**
- Request short code through dashboard
- Wait for approval

### Step 3: Test

Once you have a short code:
1. Send SMS to short code: `STATUS` or `HELP`
2. Check server logs for incoming SMS
3. Verify response is sent back

## Where to Find Short Code in Dashboard

### Common Locations:

1. **SMS → Short Codes**
   - Lists all your short codes
   - Shows status (Active, Pending, etc.)

2. **Applications → Your App → Short Codes**
   - Short codes associated with your app

3. **Dashboard Home**
   - Sometimes shown in overview section

## Contacting Support

If you can't find a short code or need help:

1. **Africa's Talking Support:**
   - Email: support@africastalking.com
   - Dashboard: Click "Support" or "Help"
   - Ask: "How do I get a short code for SMS receiving?"

2. **What to Ask:**
   - "I need a short code for testing SMS receiving"
   - "How do I request a production short code?"
   - "Where can I find my sandbox short code?"

## Testing Without Short Code (Alternative)

If you can't get a short code immediately, you can:

1. **Test the endpoint directly:**
   - Use Postman or curl to send POST requests
   - Simulate incoming SMS
   - Verify your server processes it correctly

2. **Test SMS sending:**
   - Your system can still SEND SMS (for reminders)
   - Test appointment reminders
   - Test medication reminders

## Important Notes

### Sandbox Limitations:
- ✅ Free to use
- ✅ Good for development
- ❌ Only works with verified/test numbers
- ❌ Not for production use

### Production Short Code:
- ✅ Works with any phone number
- ✅ Real SMS delivery
- ⏳ Requires approval (1-7 days)
- 💰 May have setup fees (varies by country)

## Your Action Items

**Right Now:**
1. ✅ Set up callback URL in "Incoming Messages"
2. ✅ Check dashboard for sandbox short code
3. ✅ If no short code, contact support or request one

**Next Steps:**
1. Get short code (sandbox for testing, request production)
2. Verify test phone numbers (for sandbox)
3. Test SMS receiving
4. Deploy to production when ready

## Summary

**You need a short code to receive SMS, but you can:**
- ✅ Set up callback URL now (in "Incoming Messages")
- ✅ Check for sandbox short code in dashboard
- ✅ Request production short code
- ✅ Test your endpoint while waiting

**The callback URL setup doesn't require a short code - you can configure it now!**

---

**Next:** Check your dashboard for a sandbox short code, or request a production short code if you're ready for production use.

