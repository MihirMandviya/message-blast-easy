import fetch from 'node-fetch';

async function testMediaWithLogging() {
  try {
    console.log('\n🔍 Testing Media API with detailed logging...');
    const response = await fetch('http://localhost:3001/api/fetch-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'nandlalwa',
        apiKey: '6c690e3ce94a97dd3bc5349d215f293bae88963c'
      })
    });

    console.log('Response Status:', response.status);
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testTemplatesWithLogging() {
  try {
    console.log('\n🔍 Testing Templates API with detailed logging...');
    const response = await fetch('http://localhost:3001/api/fetch-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'nandlalwa',
        password: 'Nandlal@12',
        wabaNumber: '919370853371'
      })
    });

    console.log('Response Status:', response.status);
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Wait a moment for the proxy server to start
setTimeout(async () => {
  await testMediaWithLogging();
  await testTemplatesWithLogging();
}, 2000);
