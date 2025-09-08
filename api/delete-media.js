import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, mediaId } = req.body;

    if (!userId || !mediaId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId or mediaId' 
      });
    }

    console.log('=== DELETE MEDIA API REQUEST DETAILS ===');
    console.log('User ID:', userId);
    console.log('Media ID:', mediaId);
    console.log('========================================');

    // Get API key from database
    const { data: clientData, error: clientError } = await supabase
      .from('client_users')
      .select('whatsapp_api_key')
      .eq('user_id', userId)
      .single();

    if (clientError || !clientData) {
      console.error('Failed to get client API key:', clientError);
      return res.status(400).json({ error: 'Failed to get client credentials' });
    }

    const apiKey = clientData.whatsapp_api_key;

    // Make request to WhatsApp API
    const url = `https://theultimate.io/WAApi/media?userid=${userId}&output=json&mediaId=${mediaId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1'
      }
    });

    console.log('WhatsApp API Response Status:', response.status);
    const responseText = await response.text();
    console.log('WhatsApp API Response Text:', responseText);

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to delete media from WhatsApp API',
        details: responseText
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse WhatsApp API response:', parseError);
      return res.status(500).json({ 
        error: 'Invalid response from WhatsApp API',
        details: responseText
      });
    }

    if (data.status === 'success') {
      // Remove media from database - match by client_id (the current user) and media_id
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('media_id', mediaId)
        .eq('client_id', userId);

      if (dbError) {
        console.error('Failed to remove media from database:', dbError);
        // Don't fail the request, just log the error
      }

      return res.json({ 
        success: true, 
        message: 'Media deleted successfully', 
        media: data 
      });
    } else {
      return res.status(400).json({ 
        error: data.reason || 'Failed to delete media', 
        apiResponse: data 
      });
    }

  } catch (error) {
    console.error(`Delete media error: ${error.message}`);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
