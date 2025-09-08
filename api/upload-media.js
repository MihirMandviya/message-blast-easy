import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';
import formidable from 'formidable';
import fs from 'fs';

// Helper function to get file extension based on media type
function getFileExtension(mediaType) {
  switch (mediaType) {
    case 'image':
      return 'jpg';
    case 'video':
      return 'mp4';
    case 'audio':
      return 'mp3';
    case 'document':
      return 'pdf';
    default:
      return 'bin';
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable default body parser for multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    // Parse multipart/form-data using formidable
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    // Extract fields (formidable returns arrays)
    const userId = fields.userid?.[0] || fields.userId?.[0];
    const wabaNumber = fields.wabaNumber?.[0];
    const mediaType = fields.mediaType?.[0];
    const identifier = fields.identifier?.[0];
    const description = fields.description?.[0] || '';
    const mediaFile = files.mediaFile?.[0];

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
    console.log('File:', mediaFile.originalFilename, 'Size:', mediaFile.size);
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

    // Handle media file - read file and append to form data
    const fileStream = fs.createReadStream(mediaFile.filepath);
    const extension = getFileExtension(mediaType);
    formData.append('mediaFile', fileStream, `${identifier}.${extension}`);

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

    // Clean up temporary file
    try {
      fs.unlinkSync(mediaFile.filepath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

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