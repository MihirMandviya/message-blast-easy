import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessageRequest {
  recipient_phone: string;
  message_content: string;
  message_type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''  // Use service role key for client auth
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing authorization header'
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract client session token
    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 10) + '...');
    
    // Validate client session
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('client_sessions')
      .select(`
        client_id,
        client_users!inner(
          id,
          email,
          business_name,
          whatsapp_api_key,
          whatsapp_number,
          is_active
        )
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      console.error('Session validation error:', sessionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid or expired session'
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const client = sessionData.client_users;
    if (!client.is_active) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Client account is not active'
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the request body
    const { recipient_phone, message_content, message_type }: WhatsAppMessageRequest = await req.json();

    // Create message record in database
    const { data: messageRecord, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        user_id: client.id,
        recipient_phone,
        message_content,
        message_type,
        status: 'pending'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Message creation error:', messageError);
      return new Response('Failed to create message record', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Get client's WhatsApp API key and number
    if (!client.whatsapp_api_key) {
      return new Response(JSON.stringify({
        success: false,
        error: 'WhatsApp API key not configured. Please add your API key in Settings.'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!client.whatsapp_number) {
      return new Response(JSON.stringify({
        success: false,
        error: 'WhatsApp number not configured. Please add your WhatsApp number in Settings.'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create FormData for the WhatsApp API
    const formData = new FormData();
    formData.append('userid', client.whatsapp_api_key); // Using API key as userid
    formData.append('msg', message_content);
    formData.append('wabaNumber', client.whatsapp_number);
    formData.append('mobile', recipient_phone);
    formData.append('msgType', message_type);
    formData.append('sendMethod', 'quick');
    formData.append('output', 'json');

    // Send message via theultimate.io API
    const whatsappResponse = await fetch('https://theultimate.io/WAApi/send', {
      method: 'POST',
      headers: {
        'apikey': client.whatsapp_api_key,
      },
      body: formData
    });

    const whatsappResult = await whatsappResponse.json();
    console.log('WhatsApp API response:', whatsappResult);

    // Update message status based on response
    const updateData: any = {
      sent_at: new Date().toISOString()
    };

    if (whatsappResponse.ok && whatsappResult.status === 'success') {
      updateData.status = 'sent';
    } else {
      updateData.status = 'failed';
      updateData.error_message = whatsappResult.message || 'Failed to send message';
    }

    // Update message record with result
    const { error: updateError } = await supabaseClient
      .from('messages')
      .update(updateData)
      .eq('id', messageRecord.id);

    if (updateError) {
      console.error('Message update error:', updateError);
    }

    console.log('Message processed successfully:', messageRecord.id);

    return new Response(JSON.stringify({
      success: updateData.status === 'sent',
      message: updateData.status === 'sent' ? 'Message sent successfully' : 'Message failed to send',
      message_id: messageRecord.id,
      status: updateData.status,
      whatsapp_response: whatsappResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-whatsapp-message function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});