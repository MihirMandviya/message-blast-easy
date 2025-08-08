// Script to sync fresh templates from API to database
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://vvpamvhqdyanomqvtmiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cGFtdmhxZHlhbm9tcXZ0bWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Njc5NTYsImV4cCI6MjA2ODI0Mzk1Nn0.Jq1ek02FHiTOx9m8hQzX9Gh8bmOMzWSJ2YtJIzKg3ZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncTemplatesToDatabase() {
  console.log('=== SYNCING TEMPLATES TO DATABASE ===\n');

  try {
    // Get client credentials
    const { data: clientData, error: clientError } = await supabase
      .from('client_users')
      .select('id, user_id, whatsapp_api_key, whatsapp_number')
      .eq('email', 'nandlal@example.com')
      .single();

    if (clientError || !clientData) {
      throw new Error('Failed to fetch client data');
    }

    console.log('Client data retrieved:', {
      id: clientData.id,
      user_id: clientData.user_id,
      has_api_key: !!clientData.whatsapp_api_key,
      whatsapp_number: clientData.whatsapp_number
    });

    // Fetch templates from API
    const apiUrl = `https://theultimate.io/WAApi/template?userid=${clientData.user_id}&wabaNumber=${clientData.whatsapp_number}&output=json`;
    
    console.log('Fetching templates from API...');
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': 'SERVERID=webC1',
        'apiKey': clientData.whatsapp_api_key
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const apiData = await response.json();
    console.log(`API returned ${apiData.templateList?.length || 0} templates`);

    if (!apiData.templateList || apiData.templateList.length === 0) {
      console.log('No templates found in API response');
      return;
    }

    // Clear existing templates for this client
    console.log('Clearing existing templates...');
    const { error: deleteError } = await supabase
      .from('templates')
      .delete()
      .eq('user_id', clientData.id);

    if (deleteError) {
      console.error('Error clearing templates:', deleteError);
    } else {
      console.log('Existing templates cleared');
    }

    // Prepare templates for insertion
    const templatesToInsert = apiData.templateList.map((item) => ({
      user_id: clientData.id,
      client_id: clientData.id,
      template_name: item.templateName,
      creation_time: item.creationTime,
      whatsapp_status: item.whatsAppStatus,
      system_status: item.systemStatus,
      media_type: item.mediaType,
      language: item.language,
      category: item.category,
      template_body: item.template.body || null,
      template_header: item.template.header || null,
      template_footer: item.template.footer || null,
      buttons1_type: item.template.buttons1_type || null,
      buttons1_title: item.template.buttons1_title || null
    }));

    console.log(`Inserting ${templatesToInsert.length} templates...`);

    // Insert new templates
    const { data: insertedTemplates, error: insertError } = await supabase
      .from('templates')
      .insert(templatesToInsert)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert templates: ${insertError.message}`);
    }

    console.log(`✅ Successfully synced ${insertedTemplates.length} templates to database!`);
    
    // Display summary
    console.log('\n=== SYNC SUMMARY ===');
    insertedTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.template_name} (${template.language}) - ${template.category}`);
    });

  } catch (error) {
    console.error('❌ Error syncing templates:', error.message);
  }
}

// Run the sync
syncTemplatesToDatabase();
