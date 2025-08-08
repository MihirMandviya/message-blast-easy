// Test script for WhatsApp template API request
// This should work the same as your Postman request

import fetch from 'node-fetch';

async function testTemplateRequest() {
  console.log('=== TESTING TEMPLATE API REQUEST ===\n');
  
  const options = {
    method: 'GET',
    url: 'https://theultimate.io/WAApi/template?userid=nandlalwa&password=Nandlal@12&wabaNumber=919370853371&output=json',
    headers: {
      'Cookie': 'SERVERID=webC1'
    }
  };

  try {
    console.log('Making request to:', options.url);
    console.log('Headers:', options.headers);
    
    // Using fetch instead of request (request is deprecated)
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    console.log('Raw response:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON response:', JSON.stringify(jsonData, null, 2));
    } catch (parseError) {
      console.log('Response is not valid JSON:', data);
    }

  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

// Alternative using the request library (if you prefer)
async function testTemplateRequestWithRequest() {
  console.log('\n=== TESTING WITH REQUEST LIBRARY ===\n');
  
  // You'll need to install request: npm install request
  const request = await import('request');
  
  const options = {
    method: 'GET',
    url: 'https://theultimate.io/WAApi/template?userid=nandlalwa&password=Nandlal@12&wabaNumber=919370853371&output=json',
    headers: {
      'Cookie': 'SERVERID=webC1'
    }
  };

  return new Promise((resolve, reject) => {
    request.default(options, function (error, response) {
      if (error) {
        console.error('Request error:', error);
        reject(error);
        return;
      }
      
      console.log('Response status:', response.statusCode);
      console.log('Response headers:', response.headers);
      console.log('Response body:', response.body);
      
      try {
        const jsonData = JSON.parse(response.body);
        console.log('Parsed JSON response:', JSON.stringify(jsonData, null, 2));
      } catch (parseError) {
        console.log('Response is not valid JSON:', response.body);
      }
      
      resolve(response.body);
    });
  });
}

// Run the tests
async function runTests() {
  await testTemplateRequest();
  
  // Uncomment the line below if you want to test with request library
  // await testTemplateRequestWithRequest();
}

runTests().catch(console.error);
