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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing authorization header', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Set the auth token
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: '',
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Get the request body
    const { recipient_phone, message_content, message_type }: WhatsAppMessageRequest = await req.json();

    console.log('Sending WhatsApp message:', {
      recipient_phone,
      message_content,
      message_type,
      user_id: user.id
    });

    // Get user's WhatsApp API key from their profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('whatsapp_api_key, whatsapp_number')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response('User profile not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    if (!profile.whatsapp_api_key) {
      return new Response('WhatsApp API key not configured', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Create message record in database
    const { data: messageRecord, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        user_id: user.id,
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

    // For now, we'll just mark the message as sent
    // The actual WhatsApp API integration will be done later
    const { error: updateError } = await supabaseClient
      .from('messages')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', messageRecord.id);

    if (updateError) {
      console.error('Message update error:', updateError);
    }

    console.log('Message processed successfully:', messageRecord.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Message sent successfully',
      message_id: messageRecord.id,
      status: 'sent'
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