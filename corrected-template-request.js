// Corrected version of your template request code
// This should work the same as your Postman request

import fetch from 'node-fetch';

async function fetchTemplates() {
  const options = {
    method: 'GET',
    url: 'https://theultimate.io/WAApi/template?userid=nandlalwa&password=Nandlal@12&wabaNumber=919370853371&output=json',
    headers: {
      'Cookie': 'SERVERID=webC1'
    }
  };

  try {
    console.log('Making request to:', options.url);
    
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    console.log('Raw response:', data);
    
    const jsonData = JSON.parse(data);
    console.log('Parsed response:', jsonData);
    
    return jsonData;
    
  } catch (error) {
    console.error('Request failed:', error.message);
    throw error;
  }
}

// If you prefer to use the request library (not recommended as it's deprecated)
async function fetchTemplatesWithRequest() {
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
      console.log('Response body:', response.body);
      
      try {
        const jsonData = JSON.parse(response.body);
        resolve(jsonData);
      } catch (parseError) {
        reject(new Error('Invalid JSON response'));
      }
    });
  });
}

// Run the test
fetchTemplates()
  .then(data => {
    console.log('Success! Templates fetched:', data.templateList?.length || 0, 'templates');
  })
  .catch(error => {
    console.error('Failed to fetch templates:', error.message);
  });
