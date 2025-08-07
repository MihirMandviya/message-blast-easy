// Test script for WhatsApp webhook
const webhookUrl = 'https://vvpamvhqdyanomqvtmiz.supabase.co/functions/v1/whatsapp-webhook';

// Test payloads for different scenarios
const testPayloads = [
  // Success delivery report
  {
    name: 'Success Delivery',
    payload: {
      mobile: '919175442260',
      status: 'delivered',
      transactionId: '1425628406555298614',
      msgId: 'test_msg_123',
      timestamp: new Date().toISOString()
    }
  },
  // Failed delivery report
  {
    name: 'Failed Delivery',
    payload: {
      mobile: '917887766008',
      status: 'failed',
      reason: 'Invalid phone number',
      transactionId: '860814411606149016',
      msgId: 'test_msg_456',
      timestamp: new Date().toISOString()
    }
  },
  // Sent status report
  {
    name: 'Sent Status',
    payload: {
      mobile: '919175442260',
      status: 'sent',
      transactionId: '1425628406555298614',
      msgId: 'test_msg_789',
      timestamp: new Date().toISOString()
    }
  },
  // Pending status report
  {
    name: 'Pending Status',
    payload: {
      mobile: '917887766008',
      status: 'pending',
      transactionId: '860814411606149016',
      msgId: 'test_msg_101',
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
    } catch (e) {
      console.log('Response is not JSON');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Webhook Tests');
  console.log('Webhook URL:', webhookUrl);
  
  for (const test of testPayloads) {
    await testWebhook(test.payload, test.name);
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ All tests completed!');
  console.log('\n📊 Check the webhook_logs table in your Supabase dashboard to see the results.');
  console.log('📊 Check the messages table to see if any messages were updated.');
}

// Run the tests
runTests().catch(console.error); 