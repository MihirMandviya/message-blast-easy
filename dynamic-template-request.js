// Dynamic template request that fetches credentials from database
// This replaces the hardcoded credentials with database-driven ones

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://vvpamvhqdyanomqvtmiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cGFtdmhxZHlhbm9tcXZ0bWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Njc5NTYsImV4cCI6MjA2ODI0Mzk1Nn0.Jq1ek02FHiTOx9m8hQzX9Gh8bmOMzWSJ2YtJIzKg3ZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchClientCredentials(clientId) {
  try {
    console.log('Fetching credentials for client ID:', clientId);
    
    const { data, error } = await supabase
      .from('client_users')
      .select('user_id, whatsapp_api_key, whatsapp_number, business_name')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Client not found');
    }

    console.log('Retrieved client data:', {
      user_id: data.user_id,
      whatsapp_api_key: data.whatsapp_api_key ? '***' + data.whatsapp_api_key.slice(-4) : 'NOT_SET',
      whatsapp_number: data.whatsapp_number,
      business_name: data.business_name
    });

    return data;
  } catch (error) {
    console.error('Error fetching client credentials:', error);
    throw error;
  }
}

async function fetchTemplatesWithCredentials(clientId) {
  try {
    // Fetch client credentials from database
    const client = await fetchClientCredentials(clientId);
    
    if (!client.user_id || !client.whatsapp_number) {
      throw new Error('Missing required credentials: user_id or whatsapp_number');
    }

    // For template API, we need to use a different approach since there's no password field
    // Let's try using the API key approach similar to the media API
    console.log('=== FETCHING TEMPLATES WITH API KEY ===');
    
    const templateUrl = `https://theultimate.io/WAApi/template?userid=${client.user_id}&wabaNumber=${client.whatsapp_number}&output=json`;
    
    console.log('Template URL:', templateUrl);
    console.log('Using API Key:', client.whatsapp_api_key ? '***' + client.whatsapp_api_key.slice(-4) : 'NOT_SET');

    const response = await fetch(templateUrl, {
      method: 'GET',
      headers: {
        'apiKey': client.whatsapp_api_key,
        'Cookie': 'SERVERID=webC1'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    console.log('Raw response:', data);
    
    const jsonData = JSON.parse(data);
    console.log('Parsed response:', JSON.stringify(jsonData, null, 2));
    
    return jsonData;

  } catch (error) {
    console.error('Error fetching templates:', error.message);
    throw error;
  }
}

// Alternative approach: Try with a default password if API key doesn't work
async function fetchTemplatesWithPassword(clientId, apiPassword = 'Nandlal@12') {
  try {
    const client = await fetchClientCredentials(clientId);
    
    if (!client.user_id || !client.whatsapp_number) {
      throw new Error('Missing required credentials: user_id or whatsapp_number');
    }

    console.log('=== FETCHING TEMPLATES WITH PASSWORD ===');
    
    const templateUrl = `https://theultimate.io/WAApi/template?userid=${client.user_id}&password=${apiPassword}&wabaNumber=${client.whatsapp_number}&output=json`;
    
    console.log('Template URL:', templateUrl);

    const response = await fetch(templateUrl, {
      method: 'GET',
      headers: {
        'Cookie': 'SERVERID=webC1'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    console.log('Raw response:', data);
    
    const jsonData = JSON.parse(data);
    console.log('Parsed response:', JSON.stringify(jsonData, null, 2));
    
    return jsonData;

  } catch (error) {
    console.error('Error fetching templates with password:', error.message);
    throw error;
  }
}

// Function to list all clients for testing
async function listClients() {
  try {
    const { data, error } = await supabase
      .from('client_users')
      .select('id, business_name, user_id, whatsapp_number')
      .eq('is_active', true);

    if (error) throw error;

    console.log('Available clients:');
    data.forEach(client => {
      console.log(`- ID: ${client.id}`);
      console.log(`  Business: ${client.business_name}`);
      console.log(`  User ID: ${client.user_id}`);
      console.log(`  WhatsApp: ${client.whatsapp_number}`);
      console.log('');
    });

    return data;
  } catch (error) {
    console.error('Error listing clients:', error);
    return [];
  }
}

// Main execution
async function main() {
  try {
    console.log('=== DYNAMIC TEMPLATE REQUEST ===\n');
    
    // First, list available clients
    const clients = await listClients();
    
    if (clients.length === 0) {
      console.log('No active clients found. Please create a client first.');
      return;
    }

    // Use the first client for testing
    const testClientId = clients[0].id;
    console.log(`Testing with client: ${clients[0].business_name} (${testClientId})\n`);

    // Try API key approach first
    try {
      console.log('🔄 Trying API key approach...');
      await fetchTemplatesWithCredentials(testClientId);
      console.log('✅ API key approach worked!');
    } catch (error) {
      console.log('❌ API key approach failed:', error.message);
      
      // Try password approach as fallback
      try {
        console.log('\n🔄 Trying password approach...');
        await fetchTemplatesWithPassword(testClientId);
        console.log('✅ Password approach worked!');
      } catch (passwordError) {
        console.log('❌ Password approach also failed:', passwordError.message);
        console.log('\n💡 Suggestion: You may need to add an API password field to the client_users table.');
      }
    }

  } catch (error) {
    console.error('Main execution error:', error);
  }
}

// Run the script
main().catch(console.error);
