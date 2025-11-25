# Africa's Talking API Setup Guide

## What is Africa's Talking?

Africa's Talking is a communications platform that provides SMS, USSD, Voice, and other services across Africa. In this health center system, it's used for:

- **SMS Reminders**: Send appointment and medication reminders to patients
- **USSD Service**: Allow patients to book appointments via mobile phone (dialing a code)
- **Bilingual Support**: Send messages in English or Kinyarwanda based on patient preference

## Step-by-Step Setup

### Step 1: Create an Account

1. Go to [https://africastalking.com](https://africastalking.com)
2. Click **"Sign Up"** or **"Get Started"**
3. Fill in your details:
   - Email address
   - Password
   - Country (select **Rwanda**)
   - Phone number
4. Verify your email address

### Step 2: Access the Dashboard

1. Log in to your Africa's Talking account
2. You'll be taken to the **Dashboard**
3. For testing, you'll start in the **Sandbox** environment (free, limited functionality)

### Step 3: Create an Application

1. In the dashboard, go to **"Applications"** or **"Apps"**
2. Click **"Create Application"** or **"Add App"**
3. Fill in the details:
   - **Application Name**: e.g., "Health Center Rwanda"
   - **Description**: "Health center appointment and reminder system"
   - **Environment**: Start with **Sandbox** (for testing)
4. Click **"Create"**

### Step 4: Get Your API Credentials

After creating the application, you'll see:

1. **API Key**: A long string of characters (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`)
2. **Username**: Your application username (e.g., `sandbox` for sandbox, or your custom username for production)

**Important**: 
- Copy these credentials immediately - you may not be able to see the API key again
- For sandbox, the username is usually `sandbox`
- For production, you'll get a custom username

### Step 5: Configure Your .env File

1. Open your `.env` file in the project root directory
2. Update these values:

```env
# Africa's Talking API Configuration
AT_API_KEY=your_actual_api_key_here
AT_USERNAME=sandbox
AT_SENDER_ID=HEALTH_RW
```

**Replace:**
- `your_actual_api_key_here` with your actual API key from Step 4
- `sandbox` with your username (usually `sandbox` for testing)
- `HEALTH_RW` can be changed to your preferred sender ID (must be approved by Africa's Talking for production)

### Step 6: Enable SMS in Your System

Make sure this is set in your `.env`:

```env
SMS_ENABLED=true
```

### Step 7: Restart Your Backend Server

After updating the `.env` file:

1. Stop your backend server (Ctrl+C in the terminal)
2. Restart it:
   ```bash
   npm run dev
   ```

You should see:
```
Reminder scheduler started
```

## Testing the Integration

### Test SMS Sending

You can test if SMS is working by:

1. **Using the Sandbox**: 
   - Sandbox allows you to send SMS to specific test numbers
   - Check Africa's Talking dashboard for test phone numbers
   - These are usually numbers you've verified

2. **Check Logs**:
   - Check `logs/combined.log` for SMS sending attempts
   - Look for "SMS sent successfully" messages

### Test with a Real Appointment

1. Create a test patient with a valid phone number
2. Create an appointment for that patient
3. The system will automatically send a reminder 24 hours before (if configured)

## Sandbox vs Production

### Sandbox Environment (Free, for Testing)

- **Pros**: 
  - Free to use
  - Good for development and testing
  - No charges for SMS

- **Cons**:
  - Limited functionality
  - Can only send to verified/test numbers
  - Not suitable for production use

- **Username**: Usually `sandbox`
- **API Key**: Provided when you create a sandbox app

### Production Environment (Paid, for Real Use)

- **Pros**:
  - Full functionality
  - Can send to any phone number
  - Real SMS delivery
  - USSD support

- **Cons**:
  - Requires payment/credit
  - SMS charges apply (varies by country)

- **To Switch to Production**:
  1. In Africa's Talking dashboard, create a **Production** application
  2. Get your production API key and username
  3. Update your `.env` file with production credentials
  4. **Request Sender ID**: You need to request approval for your sender ID (like `HEALTH_RW`)
  5. **Add Credit**: Add credit to your account to send SMS

## USSD Setup (Optional)

If you want to enable USSD (patients dialing a code to book appointments):

1. **In Africa's Talking Dashboard**:
   - Go to **USSD** section
   - Create a USSD service
   - Set your USSD code (e.g., `*384*123#`)
   - Configure callback URL: `https://your-domain.com/ussd`
   - For local testing, you can use a tunneling service like ngrok

2. **Update Your .env**:
   ```env
   USSD_CODE=*384*123#
   ```

3. **Test USSD**:
   - Dial the code from a mobile phone
   - The system will process the USSD request

## Troubleshooting

### Issue: "SMS service not configured"

**Solution**: 
- Check that `AT_API_KEY` and `AT_USERNAME` are set in `.env`
- Make sure there are no extra spaces or quotes
- Restart your backend server

### Issue: "Invalid API key"

**Solution**:
- Verify your API key is correct (copy-paste it again)
- Make sure you're using the right environment (sandbox vs production)
- Check that your account is active

### Issue: SMS not sending

**Solution**:
- In sandbox, make sure you're using a verified/test phone number
- Check your account has credit (for production)
- Verify phone number format (should include country code, e.g., +250788123456 for Rwanda)
- Check logs in `logs/error.log` for detailed error messages

### Issue: "Sender ID not approved"

**Solution**:
- In sandbox, you can use any sender ID
- In production, you must request approval for your sender ID
- Contact Africa's Talking support to approve your sender ID

## Cost Information

### SMS Pricing (Rwanda - Approximate)

- **Local SMS**: ~50-100 RWF per SMS (varies)
- **International SMS**: Higher rates
- Check current pricing on Africa's Talking website

### Free Credits

- New accounts often get free credits for testing
- Sandbox environment is free but limited

## Security Best Practices

1. **Never commit `.env` to Git** - Your API keys are sensitive
2. **Use different credentials for development and production**
3. **Rotate API keys periodically**
4. **Monitor your account for unusual activity**
5. **Set up billing alerts** to avoid unexpected charges

## Next Steps

After setting up Africa's Talking:

1. ✅ Test SMS sending with a test appointment
2. ✅ Verify reminders are being scheduled correctly
3. ✅ Test with real phone numbers (in production)
4. ✅ Monitor SMS delivery rates
5. ✅ Set up USSD if needed
6. ✅ Configure billing and add credit for production use

## Support Resources

- **Africa's Talking Documentation**: [https://developers.africastalking.com](https://developers.africastalking.com)
- **API Reference**: [https://developers.africastalking.com/docs](https://developers.africastalking.com/docs)
- **Support**: Contact support through your dashboard
- **Community**: Check Africa's Talking community forums

## Example .env Configuration

Here's a complete example of Africa's Talking configuration in your `.env`:

```env
# Africa's Talking API (Sandbox - for testing)
AT_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
AT_USERNAME=sandbox
AT_SENDER_ID=HEALTH_RW

# SMS Configuration
SMS_ENABLED=true
APPOINTMENT_REMINDER_HOURS=24
MEDICATION_REMINDER_MINUTES=30

# USSD Configuration
USSD_CODE=*384*123#
```

---

**Note**: For production deployment, make sure to:
- Switch to production API credentials
- Request sender ID approval
- Add sufficient credit to your account
- Test thoroughly before going live
- Monitor SMS delivery and costs

