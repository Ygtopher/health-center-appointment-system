// Test SMS Sending Script
// Run this to test if SMS sending is working

require('dotenv').config();
const africastalkingService = require('./services/africasTalking');
const logger = require('./config/logger');

async function testSMS() {
  console.log('\n=== SMS Testing Script ===\n');
  
  // Check configuration
  console.log('1. Checking Configuration...');
  console.log('   SMS_ENABLED:', process.env.SMS_ENABLED);
  console.log('   AT_API_KEY:', process.env.AT_API_KEY ? 'SET ✓' : 'NOT SET ✗');
  console.log('   AT_USERNAME:', process.env.AT_USERNAME || 'NOT SET ✗');
  console.log('   AT_SENDER_ID:', process.env.AT_SENDER_ID || 'HEALTH_RW');
  
  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
    console.log('\n❌ ERROR: API credentials not configured!');
    console.log('   Please check your .env file');
    return;
  }
  
  if (process.env.SMS_ENABLED !== 'true') {
    console.log('\n⚠️  WARNING: SMS_ENABLED is not set to "true"');
    console.log('   SMS sending may be disabled');
  }
  
  // Get test phone number
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\n2. Enter test phone number (with country code, e.g., +250788123456): ', async (phoneNumber) => {
    if (!phoneNumber) {
      console.log('❌ No phone number provided');
      readline.close();
      return;
    }
    
    console.log('\n3. Sending test SMS...');
    console.log('   To:', phoneNumber);
    console.log('   Message: "Test SMS from Health Center System"');
    
    try {
      const result = await africastalkingService.sendSMS(
        phoneNumber,
        'Test SMS from Health Center System. If you receive this, SMS is working!'
      );
      
      console.log('\n4. Result:');
      if (result.success) {
        console.log('   ✅ SMS sent successfully!');
        console.log('   Message ID:', result.messageId);
        console.log('   Status:', result.status);
        console.log('\n   Check your phone for the SMS.');
        console.log('\n   Note: In sandbox, you can only send to verified/test numbers.');
        console.log('   If you don\'t receive it, check:');
        console.log('   - Is the number verified in Africa\'s Talking dashboard?');
        console.log('   - Are you using sandbox? (only verified numbers work)');
        console.log('   - Check server logs for detailed error messages');
      } else {
        console.log('   ❌ SMS sending failed!');
        console.log('   Error:', result.error || result.message);
        if (result.data) {
          console.log('   Details:', JSON.stringify(result.data, null, 2));
        }
        console.log('\n   Common issues:');
        console.log('   - Invalid API credentials');
        console.log('   - Phone number not verified (sandbox)');
        console.log('   - Account has no credit (production)');
        console.log('   - Invalid phone number format');
      }
    } catch (error) {
      console.log('\n   ❌ Error:', error.message);
      console.log('   Stack:', error.stack);
    }
    
    readline.close();
  });
}

// Run the test
testSMS().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

