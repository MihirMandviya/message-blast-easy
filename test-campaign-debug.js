// Test script to debug campaign issues
// Run this with: node test-campaign-debug.js

const fetch = require('node-fetch');

async function testWhatsAppAPI() {
  console.log('=== CAMPAIGN DEBUG TEST ===\n');
  
  // Test 1: Check if edge function is accessible
  console.log('1. Testing edge function accessibility...');
  try {
    const response = await fetch('https://vvpamvhqdyanomqvtmiz.supabase.co/functions/v1/send-whatsapp-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer INVALID_TOKEN_FOR_TEST'
      },
      body: JSON.stringify({
        recipient_phone: '+1234567890',
        message_content: 'Test message',
        message_type: 'text'
      })
    });
    
    const result = await response.json();
    console.log('✅ Edge function is accessible');
    console.log('Response:', result);
  } catch (error) {
    console.log('❌ Edge function error:', error.message);
  }
  
  console.log('\n2. Testing direct WhatsApp API format...');
  
  // Test 2: Test the exact format you provided
  const testFormData = new FormData();
  testFormData.append('userid', 'TEST_USER_ID');
  testFormData.append('msg', 'Test message from campaign debug');
  testFormData.append('wabaNumber', 'TEST_SENDING_NUMBER');
  testFormData.append('output', 'json');
  testFormData.append('mobile', '+1234567890');
  testFormData.append('sendMethod', 'quick');
  testFormData.append('msgType', 'text');
  testFormData.append('templateName', 'test_template');
  
  try {
    const whatsappResponse = await fetch('https://theultimate.io/WAApi/send', {
      method: 'POST',
      headers: {
        'apikey': 'TEST_API_KEY',
        'Cookie': 'SERVERID=webC1'
      },
      body: testFormData
    });
    
    const whatsappResult = await whatsappResponse.text();
    console.log('✅ WhatsApp API endpoint is accessible');
    console.log('Response Status:', whatsappResponse.status);
    console.log('Response Body:', whatsappResult);
  } catch (error) {
    console.log('❌ WhatsApp API error:', error.message);
  }
  
  console.log('\n=== DEBUG INSTRUCTIONS ===');
  console.log('1. Check your browser console for JavaScript errors');
  console.log('2. Check Supabase function logs in the dashboard');
  console.log('3. Verify client has valid WhatsApp API key and number');
  console.log('4. Ensure client account is active');
  console.log('5. Check if client session is valid');
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Apply database migration: npx supabase db push');
  console.log('2. Test with a single message first');
  console.log('3. Check function logs for detailed error messages');
}

testWhatsAppAPI().catch(console.error); 