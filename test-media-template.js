import fetch from 'node-fetch';

async function testMediaTemplateCreation() {
  console.log('Testing media template creation...');
  
  const requestBody = {
    userId: 'nandlalwa',
    apiKey: '6c690e3ce94a97dd3bc5349d215f293bae88963c',
    password: 'Nandlal@12',
    wabaNumber: '919370853371',
    templateName: 'test_media_template_' + Date.now(),
    templateDescription: 'Test media template from script',
    language: 'en',
    category: 'MARKETING',
    msgType: 'media',
    body: 'Shop now through {{1}} and use code {{2}} to get {{3}} off of all merchandise.',
    bodySample: 'Shop now through the end of August and use code 25OFF to get 25% off of all merchandise.',
    footer: 'To Unsubscribe send STOP',
    mediaType: 'image',
    headerSampleFile: 'https://smsnotify.one/samples/68c456a1c33d6.png'
  };

  try {
    console.log('Sending request with body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:3001/api/create-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    console.log('\n=== RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: Media template created successfully!');
    } else {
      console.log('\n❌ ERROR: Failed to create media template');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testMediaTemplateCreation();
