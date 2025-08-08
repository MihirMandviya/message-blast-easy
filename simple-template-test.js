// Simple test for WhatsApp template API
import fetch from 'node-fetch';

const url = 'https://theultimate.io/WAApi/template?userid=nandlalwa&password=Nandlal@12&wabaNumber=919370853371&output=json';

console.log('Testing WhatsApp template API...');
console.log('URL:', url);

fetch(url, {
  method: 'GET',
  headers: {
    'Cookie': 'SERVERID=webC1'
  }
})
.then(response => {
  console.log('Status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response:', data);
  const json = JSON.parse(data);
  console.log('Templates found:', json.templateList?.length || 0);
})
.catch(error => {
  console.error('Error:', error.message);
});
