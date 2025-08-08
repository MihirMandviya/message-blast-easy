// Debug script to check client data
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://vvpamvhqdyanomqvtmiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cGFtdmhxZHlhbm9tcXZ0bWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Njc5NTYsImV4cCI6MjA2ODI0Mzk1Nn0.Jq1ek02FHiTOx9m8hQzX9Gh8bmOMzWSJ2YtJIzKg3ZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugClientData() {
  console.log('=== DEBUGGING CLIENT DATA ===\n');

  try {
    // Get all client users to see what's in the database
    const { data: allClients, error: allError } = await supabase
      .from('client_users')
      .select('id, email, user_id, whatsapp_api_key, whatsapp_number');

    if (allError) {
      throw new Error(`Failed to fetch clients: ${allError.message}`);
    }

    console.log('All clients in database:');
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. ID: ${client.id}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   User ID: ${client.user_id}`);
      console.log(`   Has API Key: ${!!client.whatsapp_api_key}`);
      console.log(`   WhatsApp Number: ${client.whatsapp_number}`);
      console.log('');
    });

    // Check if there are multiple clients with similar emails
    const nandlalClients = allClients.filter(client => 
      client.email.includes('nandlal') || 
      (client.user_id && client.user_id.includes('nandlal'))
    );

    if (nandlalClients.length > 1) {
      console.log('⚠️  Found multiple clients with similar names:');
      nandlalClients.forEach((client, index) => {
        console.log(`${index + 1}. Email: ${client.email}, User ID: ${client.user_id}`);
      });
    }

    // Get the specific client that should be used
    const { data: specificClient, error: specificError } = await supabase
      .from('client_users')
      .select('*')
      .eq('email', 'nandlal@example.com')
      .single();

    if (specificError) {
      throw new Error(`Failed to fetch specific client: ${specificError.message}`);
    }

    console.log('✅ Correct client data from database:');
    console.log(`   ID: ${specificClient.id}`);
    console.log(`   Email: ${specificClient.email}`);
    console.log(`   User ID: ${specificClient.user_id}`);
    console.log(`   WhatsApp Number: ${specificClient.whatsapp_number}`);
    console.log(`   Has API Key: ${!!specificClient.whatsapp_api_key}`);

  } catch (error) {
    console.error('❌ Error debugging client data:', error.message);
  }
}

debugClientData();
