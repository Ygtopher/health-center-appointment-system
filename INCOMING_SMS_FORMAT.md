# Incoming SMS Format from Africa's Talking

## Overview

When a patient sends an SMS to your short code, Africa's Talking forwards it to your callback URL with the following data structure.

## Callback URL Setup

**Location in Dashboard:**
- SMS → SMS Callback URLs → Incoming Messages

**Your Callback URL:**
```
https://overrigged-michaele-curtate.ngrok-free.dev/sms
```

## Incoming Message Fields

When an SMS is received, Africa's Talking sends a POST request to your callback URL with these fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Internal ID that Africa's Talking uses to store the message | `ATXid_1234567890` |
| `from` | String | The phone number that sent the message | `+250788123456` |
| `to` | String | Your short code or number that received the message | `20880` or `HEALTH_RW` |
| `text` | String | The message content | `STATUS` or `CANCEL` |
| `date` | String | Date and time when the message was received | `2024-01-15T10:30:00Z` |
| `linkId` | String (Optional) | Required when responding to premium messages | `123e4567-e89b-12d3-a456-426614174000` |
| `cost` | String | Amount incurred to send the SMS | `RWF 50.00` or `KES 1.00` |
| `networkCode` | String | Unique identifier for the telco that handled the message | `63510` (MTN Rwanda) |

## Network Codes (Rwanda)

| Code | Network |
|------|---------|
| `63510` | MTN Rwanda |
| `63513` | Tigo Rwanda |
| `63514` | Airtel Rwanda |
| `99999` | Athena (Sandbox - for testing) |

## Network Codes (Other Countries)

### Nigeria
- `62120`: Airtel Nigeria
- `62130`: MTN Nigeria
- `62150`: Glo Nigeria
- `62160`: Etisalat Nigeria

### Kenya
- `63902`: Safaricom
- `63903`: Airtel Kenya
- `63907`: Orange Kenya
- `63999`: Equitel Kenya

### Tanzania
- `64002`: Tigo Tanzania
- `64003`: Zantel Tanzania
- `64004`: Vodacom Tanzania
- `64005`: Airtel Tanzania
- `64007`: TTCL Tanzania
- `64009`: Halotel Tanzania

### Uganda
- `64101`: Airtel Uganda
- `64110`: MTN Uganda
- `64111`: UTL Uganda
- `64114`: Africell Uganda

### Malawi
- `65001`: TNM Malawi
- `65010`: Airtel Malawi

## Example Request

When a patient sends "STATUS" to your short code, Africa's Talking sends:

```http
POST /sms HTTP/1.1
Content-Type: application/x-www-form-urlencoded

id=ATXid_1234567890abcdef
&from=+250788123456
&to=20880
&text=STATUS
&date=2024-01-15T10:30:00Z
&linkId=
&cost=RWF 50.00
&networkCode=63510
```

## Cost Format

The `cost` field format is:
```
(3-digit Currency Code)(space)(Decimal Value)
```

Examples:
- `RWF 50.00` - 50 Rwandan Francs
- `KES 1.00` - 1 Kenyan Shilling
- `UGX 100.00` - 100 Ugandan Shillings

## Response Format

Your server must respond with HTTP 200 status code.

**Response can be:**
- Empty string: `""`
- Acknowledgment message: `"Received"`

**Important:** Always return HTTP 200, even if there's an error processing the message.

## Implementation

The SMS controller now handles all these fields:

```javascript
const {
  id,          // Africa's Talking message ID
  from,        // Sender's phone number
  to,          // Your short code
  text,        // Message content
  date,        // Timestamp
  linkId,      // Link ID (for premium)
  cost,        // Cost (e.g., "RWF 50.00")
  networkCode, // Telco code (e.g., "63510")
} = req.body;
```

## Logging

All incoming SMS data is logged with:
- Message ID
- Sender number
- Message content
- Network information
- Cost information
- Timestamp

Check logs in:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- Console output (if running with `npm run dev`)

## Testing

### Test with ngrok

1. Make sure your server is running
2. Make sure ngrok is running
3. Configure callback URL in Africa's Talking dashboard
4. Send SMS to your short code
5. Check server logs for incoming SMS

### Test Manually

You can test the endpoint manually:

```bash
curl -X POST https://overrigged-michaele-curtate.ngrok-free.dev/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "id=TEST123&from=+250788123456&to=20880&text=STATUS&date=2024-01-15T10:30:00Z&networkCode=63510&cost=RWF 50.00"
```

## Database Storage (Optional)

You can create a table to store incoming SMS for audit:

```sql
CREATE TABLE incoming_sms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  at_message_id VARCHAR(255),
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  message TEXT,
  received_at TIMESTAMP,
  link_id VARCHAR(255),
  cost VARCHAR(50),
  network_code VARCHAR(20),
  network_name VARCHAR(100),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incoming_sms_from ON incoming_sms(from_number);
CREATE INDEX idx_incoming_sms_date ON incoming_sms(received_at);
```

Then uncomment the database insert code in `smsController.js`.

## Troubleshooting

### Issue: Not receiving SMS

**Check:**
1. Is callback URL configured correctly?
2. Is server running and accessible?
3. Is ngrok running (for local testing)?
4. Check server logs for incoming requests

### Issue: Missing fields

**Check:**
1. Some fields are optional (like `linkId`)
2. `cost` may not be available in sandbox
3. `networkCode` will be `99999` in sandbox

### Issue: Wrong network code

**Check:**
1. Sandbox uses `99999` (Athena)
2. Production uses real network codes
3. Check the network code mapping above

## Security Considerations

1. **Validate incoming requests:**
   - Verify the request is from Africa's Talking
   - Consider implementing request signature validation

2. **Rate limiting:**
   - Monitor for spam
   - Implement rate limiting if needed

3. **Logging:**
   - Log all incoming SMS for audit
   - Store sensitive data securely

---

**The system now properly handles all incoming SMS fields from Africa's Talking!**

