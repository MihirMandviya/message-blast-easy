// Test script to check proxy server functionality
import fetch from 'node-fetch';

async function testProxyServer() {
  console.log('=== TESTING PROXY SERVER ===\n');

  try {
    // Test 1: Check if proxy server is reachable
    console.log('1. Testing proxy server connectivity...');
    const response = await fetch('/api/fetch-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test',
        apiKey: 'test',
        wabaNumber: 'test'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.text();
    console.log('Response body:', data);

    if (response.ok) {
      console.log('✅ Proxy server is responding correctly');
    } else {
      console.log('❌ Proxy server returned error status');
    }

  } catch (error) {
    console.error('❌ Error testing proxy server:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 The proxy server is not running. Start it with: node proxy-server.js');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Cannot resolve localhost. Check your network configuration.');
    }
  }
}

testProxyServer();
