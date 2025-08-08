// Script to fix client data consistency
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://vvpamvhqdyanomqvtmiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cGFtdmhxZHlhbm9tcXZ0bWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Njc5NTYsImV4cCI6MjA2ODI0Mzk1Nn0.Jq1ek02FHiTOx9m8hQzX9Gh8bmOMzWSJ2YtJIzKg3ZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixClientData() {
  console.log('=== FIXING CLIENT DATA ===\n');

  try {
    // First, let's see what clients exist
    const { data: allClients, error: allError } = await supabase
      .from('client_users')
      .select('id, email, user_id, whatsapp_api_key, whatsapp_number');

    if (allError) {
      throw new Error(`Failed to fetch clients: ${allError.message}`);
    }

    console.log('Current clients in database:');
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. ID: ${client.id}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   User ID: ${client.user_id}`);
      console.log(`   WhatsApp Number: ${client.whatsapp_number}`);
      console.log('');
    });

    // Find the correct client (nandlal@example.com)
    const correctClient = allClients.find(client => client.email === 'nandlal@example.com');
    
    if (!correctClient) {
      throw new Error('Correct client not found');
    }

    console.log('✅ Correct client found:');
    console.log(`   ID: ${correctClient.id}`);
    console.log(`   Email: ${correctClient.email}`);
    console.log(`   User ID: ${correctClient.user_id}`);
    console.log(`   WhatsApp Number: ${correctClient.whatsapp_number}`);

    // Check if there are any other clients with similar user_id that might be causing confusion
    const similarClients = allClients.filter(client => 
      client.user_id && client.user_id.includes('nandlal') && client.id !== correctClient.id
    );

    if (similarClients.length > 0) {
      console.log('\n⚠️  Found similar clients that might cause confusion:');
      similarClients.forEach((client, index) => {
        console.log(`${index + 1}. ID: ${client.id}, Email: ${client.email}, User ID: ${client.user_id}`);
      });
      
      // Update these to have different user_ids to avoid confusion
      for (const client of similarClients) {
        const newUserId = `${client.user_id}_old`;
        console.log(`\n🔄 Updating client ${client.id} user_id from "${client.user_id}" to "${newUserId}"`);
        
        const { error: updateError } = await supabase
          .from('client_users')
          .update({ user_id: newUserId })
          .eq('id', client.id);
        
        if (updateError) {
          console.error(`❌ Failed to update client ${client.id}:`, updateError.message);
        } else {
          console.log(`✅ Updated client ${client.id}`);
        }
      }
    }

    // Verify the correct client still has the right data
    const { data: verifiedClient, error: verifyError } = await supabase
      .from('client_users')
      .select('*')
      .eq('email', 'nandlal@example.com')
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify client: ${verifyError.message}`);
    }

    console.log('\n✅ Final verification - Correct client data:');
    console.log(`   ID: ${verifiedClient.id}`);
    console.log(`   Email: ${verifiedClient.email}`);
    console.log(`   User ID: ${verifiedClient.user_id}`);
    console.log(`   WhatsApp Number: ${verifiedClient.whatsapp_number}`);
    console.log(`   Has API Key: ${!!verifiedClient.whatsapp_api_key}`);

    console.log('\n🎯 Next steps:');
    console.log('1. Clear browser session (localStorage.removeItem("client_session"))');
    console.log('2. Refresh the page');
    console.log('3. Log in again with nandlal@example.com');
    console.log('4. The frontend should now use user_id: "nandlalwa"');

  } catch (error) {
    console.error('❌ Error fixing client data:', error.message);
  }
}

fixClientData();
