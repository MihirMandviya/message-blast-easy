// Test script for WhatsApp webhook with real message data
const webhookUrl = 'https://vvpamvhqdyanomqvtmiz.supabase.co/functions/v1/whatsapp-webhook';

// Test with real message data from the database
const realMessageTests = [
  // Test with real message - delivered status
  {
    name: 'Real Message - Delivered',
    payload: {
      mobile: '917887766008', // Real phone number from database
      status: 'delivered',
      transactionId: 'real_transaction_123',
      msgId: 'real_msg_456',
      timestamp: new Date().toISOString()
    }
  },
  // Test with real message - failed status
  {
    name: 'Real Message - Failed',
    payload: {
      mobile: '919175442260', // Real phone number from database
      status: 'failed',
      reason: 'Phone number not reachable',
      transactionId: 'real_transaction_789',
      msgId: 'real_msg_101',
      timestamp: new Date().toISOString()
    }
  }
];

async function testWebhook(payload, name) {
  console.log(`\n=== Testing: ${name} ===`);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    try {
      const parsedResult = JSON.parse(result);
      console.log('Parsed Response:', JSON.stringify(parsedResult, null, 2));
      
      if (parsedResult.success) {
        console.log('✅ Webhook processed successfully!');
        console.log('Message ID:', parsedResult.message_id);
        console.log('New Status:', parsedResult.status);
      } else {
        console.log('❌ Webhook processing failed:', parsedResult.error);
      }
    } catch (e) {
      console.log('Response is not JSON');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Real Message Webhook Tests');
  console.log('Webhook URL:', webhookUrl);
  console.log('\n📝 Note: These tests use real phone numbers from the messages table');
  
  for (const test of realMessageTests) {
    await testWebhook(test.payload, test.name);
    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ All tests completed!');
  console.log('\n📊 Check the webhook_logs table in your Supabase dashboard to see the results.');
  console.log('📊 Check the messages table to see if any messages were updated.');
  console.log('📊 Check the campaigns table to see if statistics were updated.');
}

// Run the tests
runTests().catch(console.error); 