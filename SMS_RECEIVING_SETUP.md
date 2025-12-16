# Setting Up SMS Receiving on Africa's Talking

This guide will help you configure your system to receive incoming SMS messages from patients.

## Overview

When patients send SMS to your short code or number, Africa's Talking will forward those messages to your server. This allows patients to:
- Check appointment status by texting "STATUS"
- Cancel appointments by texting "CANCEL"
- Get help by texting "HELP"

## Step 1: Configure Callback URL in Africa's Talking Dashboard

1. **Log in to Africa's Talking Dashboard**
   - Go to [https://account.africastalking.com](https://account.africastalking.com)
   - Navigate to your application

2. **Go to SMS Settings**
   - Click on **"SMS"** in the left menu
   - Find **"Callback URL"** or **"Incoming SMS Settings"**

3. **Set Your Callback URL**
   
   **For Production:**
   ```
   https://your-domain.com/sms
   ```
   Replace `your-domain.com` with your actual domain name.

   **For Local Testing (using ngrok):**
   ```
   https://your-ngrok-url.ngrok.io/sms
   ```
   See "Using ngrok for Local Testing" section below.

4. **Save the Configuration**
   - Click **"Save"** or **"Update"**
   - Africa's Talking will send a test request to verify the URL

## Step 2: Using ngrok for Local Testing

If you're testing locally, you need to expose your local server to the internet using ngrok.

### Install ngrok

1. Download ngrok from [https://ngrok.com/download](https://ngrok.com/download)
2. Extract and add to your PATH, or use it directly

### Start ngrok

1. **Start your backend server:**
   ```bash
   npm run dev
   ```
   Your server should be running on port 3000 (or your configured port).

2. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL:**
   You'll see something like:
   ```
   Forwarding   https://abc123.ngrok.io -> http://localhost:3000
   ```
   Copy the `https://abc123.ngrok.io` URL.

4. **Use this URL in Africa's Talking:**
   - Set callback URL to: `https://abc123.ngrok.io/sms`
   - **Important:** Use the HTTPS URL, not HTTP

### Note on ngrok URLs

- Free ngrok URLs change every time you restart ngrok
- You'll need to update the callback URL in Africa's Talking dashboard each time
- For production, use a permanent domain name

## Step 3: Verify the Endpoint is Working

### Test the Endpoint Locally

You can test if your endpoint is working by sending a POST request:

```bash
curl -X POST http://localhost:3000/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=+250788123456&to=HEALTH_RW&text=STATUS&date=2024-01-15T10:00:00Z"
```

### Check Server Logs

When an SMS is received, you should see in your logs:
```
Incoming SMS received: { from: '+250788123456', to: 'HEALTH_RW', text: 'STATUS', ... }
```

## Step 4: Available SMS Commands

Patients can send these commands via SMS:

### STATUS
Check their next appointment status.

**Example:**
- Patient sends: `STATUS`
- System responds: Appointment details (date, time, health center, status)

### CANCEL
Cancel their next appointment.

**Example:**
- Patient sends: `CANCEL`
- System responds: Confirmation that appointment was cancelled

### HELP
Get help message with available commands.

**Example:**
- Patient sends: `HELP`
- System responds: List of available commands

### Language Support
Commands work in both English and Kinyarwanda:
- `STATUS` / `REBA` / `IMITERERE`
- `CANCEL` / `KURAHO` / `GUKURAHO`
- `HELP` / `UBUFASHA` / `FASHA`

## Step 5: How It Works

1. **Patient sends SMS** to your short code/number
2. **Africa's Talking receives** the SMS
3. **Africa's Talking forwards** it to your callback URL (`/sms`)
4. **Your server processes** the SMS:
   - Identifies the patient by phone number
   - Processes the command
   - Sends response SMS back to patient
5. **Patient receives** the response SMS

## Step 6: Production Deployment

### For Production:

1. **Use a permanent domain:**
   - Deploy your server to a hosting provider (AWS, DigitalOcean, etc.)
   - Set up a domain name (e.g., `healthcenter.rw`)
   - Configure SSL certificate (HTTPS is required)

2. **Update Callback URL:**
   ```
   https://healthcenter.rw/sms
   ```

3. **Test thoroughly:**
   - Send test SMS from different numbers
   - Verify responses are received
   - Check logs for any errors

## Troubleshooting

### Issue: SMS not being received

**Check:**
1. Is your server running and accessible?
2. Is the callback URL correct in Africa's Talking dashboard?
3. Is the URL using HTTPS? (HTTP may not work)
4. Check server logs for incoming requests
5. Verify ngrok is running (if testing locally)

### Issue: "404 Not Found"

**Solution:**
- Make sure the route is `/sms` (not `/api/sms`)
- Check that the route is registered in `server.js`
- Verify the server is running on the correct port

### Issue: SMS received but no response

**Check:**
1. Verify patient exists in database with correct phone number
2. Check server logs for errors
3. Ensure SMS sending is enabled (`SMS_ENABLED=true`)
4. Verify Africa's Talking credentials are correct

### Issue: ngrok URL not working

**Solutions:**
1. Make sure you're using the HTTPS URL (not HTTP)
2. Restart ngrok and update the callback URL
3. Check that your local server is running
4. Verify firewall isn't blocking connections

## Security Considerations

1. **Validate incoming requests:**
   - Africa's Talking provides authentication mechanisms
   - Consider implementing request validation
   - Log all incoming SMS for audit purposes

2. **Rate limiting:**
   - Consider adding rate limiting to prevent abuse
   - Monitor for spam or malicious messages

3. **Phone number validation:**
   - Validate phone numbers before processing
   - Sanitize message content

## Testing Checklist

- [ ] Callback URL configured in Africa's Talking dashboard
- [ ] Server endpoint `/sms` is accessible
- [ ] Test SMS received and logged
- [ ] STATUS command works
- [ ] CANCEL command works
- [ ] HELP command works
- [ ] Responses sent back to patients
- [ ] Works in both English and Kinyarwanda
- [ ] Error handling works correctly

## Example Flow

1. **Patient sends:** `STATUS` to short code
2. **System receives:** SMS at `/sms` endpoint
3. **System processes:**
   - Finds patient by phone number
   - Queries next appointment
   - Formats response message
4. **System sends:** Response SMS to patient
5. **Patient receives:** "Appointment: Kigali Health Center\nDate: 15/01/2024\nTime: 10:00\nStatus: scheduled"

## Additional Features You Can Add

1. **Appointment booking via SMS:**
   - Patient sends: `BOOK 15-01-2024 10:00`
   - System creates appointment

2. **Prescription reminders:**
   - Patient sends: `MEDS` to check medication schedule

3. **Two-way communication:**
   - Staff can send messages to patients
   - Patients can reply with questions

## Support

For issues with:
- **Africa's Talking setup:** Check [Africa's Talking documentation](https://developers.africastalking.com)
- **Server configuration:** Check server logs in `logs/error.log`
- **SMS delivery:** Verify credentials and account status in Africa's Talking dashboard

---

**Note:** Make sure your server is accessible from the internet (not behind a firewall) for the callback to work. For local development, always use ngrok or similar tunneling service.

