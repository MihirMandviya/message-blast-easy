import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, wabaNumber, mediaType, identifier, description, mediaFile } = req.body;

    if (!userId || !wabaNumber || !mediaType || !identifier || !mediaFile) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, wabaNumber, mediaType, identifier, or mediaFile' 
      });
    }

    console.log('=== UPLOAD MEDIA API REQUEST DETAILS ===');
    console.log('User ID:', userId);
    console.log('WhatsApp Number:', wabaNumber);
    console.log('Media Type:', mediaType);
    console.log('Identifier:', identifier);
    console.log('Description:', description);
    console.log('========================================');

    // Get client credentials from database
    const { data: clientData, error: clientError } = await supabase
      .from('client_users')
      .select('whatsapp_api_key, password')
      .eq('user_id', userId)
      .single();

    if (clientError || !clientData) {
      console.error('Failed to get client credentials:', clientError);
      return res.status(400).json({ error: 'Failed to get client credentials' });
    }

    const apiKey = clientData.whatsapp_api_key;
    const password = clientData.password;

    // Create FormData for the WhatsApp API
    const formData = new FormData();
    formData.append('userid', userId);
    formData.append('password', password);
    formData.append('wabaNumber', wabaNumber);
    formData.append('output', 'json');
    formData.append('mediaType', mediaType);
    formData.append('identifier', identifier);
    if (description) {
      formData.append('description', description);
    }

    // Handle media file - convert base64 to buffer
    if (mediaFile.startsWith('data:')) {
      // Handle base64 data URL
      const base64Data = mediaFile.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Determine file extension based on media type
      let extension = '';
      switch (mediaType) {
        case 'image':
          extension = '.jpg';
          break;
        case 'video':
          extension = '.mp4';
          break;
        case 'audio':
          extension = '.mp3';
          break;
        case 'document':
          extension = '.pdf';
          break;
        default:
          extension = '.bin';
      }
      
      formData.append('mediaFile', buffer, `${identifier}${extension}`);
    } else {
      // Handle file path or URL
      formData.append('mediaFile', mediaFile);
    }

    // Make request to WhatsApp API
    const url = 'https://theultimate.io/WAApi/media';
    console.log('Making request to WhatsApp API:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1',
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('WhatsApp API Response Status:', response.status);
    const responseText = await response.text();
    console.log('WhatsApp API Response Text:', responseText);

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to upload media to WhatsApp API',
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
      // Get the client_id (from clients table) for this user
      let clientOrgId = userId;
      try {
        // First try to get the client_id from the client_users table
        const { data: clientUserData, error: clientUserError } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('user_id', userId)
          .single();
        
        if (!clientUserError && clientUserData?.client_id) {
          clientOrgId = clientUserData.client_id;
          console.log('Retrieved client_id from database:', clientOrgId);
        } else {
          console.error('Could not find client organization ID');
          throw new Error('Could not find client organization ID');
        }
      } catch (error) {
        console.error('Error fetching client_id:', error);
        throw error;
      }

      // Store media info in database
      const { error: dbError } = await supabase
        .from('media')
        .upsert({
          user_id: clientOrgId, // Use the organization/client ID
          client_id: userId, // Use the current client_user ID
          added_by: userId, // Set added_by to the current user
          name: identifier,
          description: description || '',
          media_type: mediaType,
          media_id: data.mediaId || null, // Use media_id instead of whatsapp_media_id
          status: 'active',
          waba_number: null, // Will be set when syncing
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'name,user_id'
        });

      if (dbError) {
        console.error('Failed to store media in database:', dbError);
        // Don't fail the request, just log the error
      }

      return res.json({ 
        success: true, 
        message: 'Media uploaded successfully', 
        media: data 
      });
    } else {
      return res.status(400).json({ 
        error: data.reason || 'Failed to upload media', 
        apiResponse: data 
      });
    }

  } catch (error) {
    console.error(`Upload media error: ${error.message}`);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
