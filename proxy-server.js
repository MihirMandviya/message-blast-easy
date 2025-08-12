import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "https://vvpamvhqdyanomqvtmiz.supabase.co",
  process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cGFtdmhxZHlhbm9tcXZ0bWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Njc5NTYsImV4cCI6MjA2ODI0Mzk1Nn0.Jq1ek02FHiTOx9m8hQzX9Gh8bmOMzWSJ2YtJIzKg3ZQ"
);

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Function to log to file
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync('api-requests.log', logMessage);
  console.log(message);
};

// Proxy endpoint for media API
app.post('/api/fetch-media', async (req, res) => {
  try {
    const { userId, apiKey } = req.body;

    if (!userId || !apiKey) {
      return res.status(400).json({ error: 'Missing userId or apiKey' });
    }

    logToFile('=== MEDIA API REQUEST DETAILS ===');
    logToFile(`User ID: ${userId}`);
    logToFile(`API Key: ${apiKey}`);
    logToFile(`Full URL: https://theultimate.io/WAApi/media?userid=${userId}&output=json`);
    logToFile(`Request Headers: ${JSON.stringify({
      'apiKey': apiKey,
      'Cookie': 'SERVERID=webC1'
    }, null, 2)}`);
    logToFile('================================');

    const response = await fetch(`https://theultimate.io/WAApi/media?userid=${userId}&output=json`, {
      method: 'GET',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logToFile(`API Error: ${errorText}`);
      return res.status(response.status).json({ 
        error: `HTTP error! status: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (data.status === 'success' && data.mediaList) {
      const mediaList = JSON.parse(data.mediaList);
      return res.json({
        success: true,
        media: mediaList,
        count: mediaList.length
      });
    } else {
      return res.status(400).json({ 
        error: data.reason || 'Failed to fetch media',
        apiResponse: data
      });
    }

  } catch (error) {
    logToFile(`Proxy error: ${error.message}`);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Proxy endpoint for templates API
app.post('/api/fetch-templates', async (req, res) => {
  try {
    const { userId, apiKey, wabaNumber } = req.body;

    if (!userId || !apiKey || !wabaNumber) {
      return res.status(400).json({ error: 'Missing userId, apiKey, or wabaNumber' });
    }

    logToFile('=== TEMPLATES API REQUEST DETAILS ===');
    logToFile(`User ID: ${userId}`);
    logToFile(`API Key: ${apiKey ? '***' + apiKey.slice(-4) : 'NOT_SET'}`);
    logToFile(`WhatsApp Number: ${wabaNumber}`);
    logToFile(`Full URL: https://theultimate.io/WAApi/template?userid=${userId}&wabaNumber=${wabaNumber}&output=json`);
    logToFile(`Request Headers: ${JSON.stringify({
      'apiKey': apiKey ? '***' + apiKey.slice(-4) : 'NOT_SET',
      'Cookie': 'SERVERID=webC1'
    }, null, 2)}`);
    logToFile('====================================');

    // Use API key approach (which we confirmed works)
    const response = await fetch(`https://theultimate.io/WAApi/template?userid=${userId}&wabaNumber=${wabaNumber}&output=json`, {
      method: 'GET',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logToFile(`API Error: ${errorText}`);
      return res.status(response.status).json({ 
        error: `HTTP error! status: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (data.status === 'success' && data.templateList) {
      return res.json({
        success: true,
        templates: data.templateList,
        count: data.templateList.length
      });
    } else {
      return res.status(400).json({ 
        error: data.reason || 'Failed to fetch templates',
        apiResponse: data
      });
    }

  } catch (error) {
    logToFile(`Proxy error: ${error.message}`);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Proxy endpoint for creating templates
app.post('/api/create-template', async (req, res) => {
  try {
    const { 
      userId, 
      apiKey, 
      password,
      wabaNumber,
      templateName,
      templateDescription,
      language,
      category,
      msgType,
      header,
      body,
      footer,
      headerSample,
      bodySample,
      buttons,
      mediaType,
      headerSampleFile,
      headerFile
    } = req.body;

    if (!userId || !apiKey || !password || !wabaNumber || !templateName) {
      return res.status(400).json({ error: 'Missing required fields: userId, apiKey, password, wabaNumber, or templateName' });
    }

    logToFile('=== CREATE TEMPLATE API REQUEST DETAILS ===');
    logToFile(`User ID: ${userId}`);
    logToFile(`API Key: ${apiKey ? '***' + apiKey.slice(-4) : 'NOT_SET'}`);
    logToFile(`WhatsApp Number: ${wabaNumber}`);
    logToFile(`Template Name: ${templateName}`);
    logToFile(`Template Description: ${templateDescription}`);
    logToFile(`Language: ${language}`);
    logToFile(`Category: ${category}`);
    logToFile(`Message Type: ${msgType}`);
    logToFile(`Header: ${header}`);
    logToFile(`Body: ${body}`);
    logToFile(`Footer: ${footer}`);
    logToFile(`Buttons: ${buttons ? JSON.stringify(buttons) : 'NONE'}`);
    logToFile(`Media Type: ${mediaType}`);
    logToFile('==========================================');

    // Build form data using FormData for multipart/form-data
    const formData = new FormData();
    formData.append('userid', userId);
    formData.append('password', password);
    formData.append('wabaNumber', wabaNumber);
    formData.append('output', 'json');
    formData.append('templateName', templateName);
    
    if (templateDescription) formData.append('templateDescription', templateDescription);
    if (language) formData.append('language', language);
    if (category) formData.append('category', category);
    if (msgType) formData.append('msgType', msgType);
    if (header) formData.append('header', header);
    if (body) formData.append('body', body);
    if (footer) formData.append('footer', footer);
    if (headerSample) formData.append('headerSample', headerSample);
    if (bodySample) formData.append('bodySample', bodySample);
    if (buttons) formData.append('buttons', JSON.stringify(buttons));
    if (mediaType) formData.append('mediaType', mediaType);
    
                   // For media templates, include mediaUrl parameter only if provided
      if (msgType === 'media') {
        const headerFile = req.body.headerFile;
        logToFile(`Processing media template with headerFile: ${headerFile}`);
        if (headerFile && headerFile.trim()) {
                     // Extract mediaId from the URL if it's a download URL
           const urlMatch = headerFile.match(/mediaId=(\d+)/);
           logToFile('URL match result: ' + JSON.stringify(urlMatch));
           if (urlMatch && urlMatch[1]) {
             const mediaId = urlMatch[1];
             formData.append('mediaId', mediaId);
             logToFile(`Media template - mediaId added: ${mediaId}`);
           } else {
             // If it's a direct URL, use mediaUrl
             formData.append('mediaUrl', headerFile.trim());
             logToFile(`Media template - mediaUrl added: ${headerFile.trim()}`);
           }
          
          // Debug: Log all FormData entries
          logToFile('=== FORM DATA CONTENTS ===');
          for (let [key, value] of formData.entries()) {
            logToFile(`${key}: ${value}`);
          }
          logToFile('==========================');
        } else {
          logToFile('Media template - no headerFile provided, this will cause an error');
          return res.status(400).json({ 
            error: 'Missing headerFile for media template',
            details: 'Media templates require a headerFile parameter'
          });
        }
      }

    const response = await fetch('https://theultimate.io/WAApi/template', {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1'
        // Note: Don't set Content-Type header for FormData - let the browser set it with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      logToFile(`API Error: ${errorText}`);
      return res.status(response.status).json({ 
        error: `HTTP error! status: ${response.status}`,
        details: errorText
      });
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text();
    logToFile(`API Response Text: ${responseText}`);
    
    if (!responseText || responseText.trim() === '') {
      logToFile('API returned empty response');
      return res.status(400).json({ 
        error: 'Empty response from API',
        details: 'The API returned an empty response'
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logToFile(`JSON Parse Error: ${parseError.message}`);
      logToFile(`Response that failed to parse: ${responseText}`);
      return res.status(400).json({ 
        error: 'Invalid JSON response from API',
        details: responseText.substring(0, 500) // First 500 chars of response
      });
    }
    
    if (data.status === 'success') {
      return res.json({
        success: true,
        message: 'Template created successfully',
        template: data
      });
    } else {
      return res.status(400).json({ 
        error: data.reason || 'Failed to create template',
        apiResponse: data
      });
    }

  } catch (error) {
    logToFile(`Proxy error: ${error.message}`);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Proxy endpoint for deleting templates
app.delete('/api/delete-template', async (req, res) => {
  try {
    const { 
      userId, 
      password,
      wabaNumber,
      templateName,
      language
    } = req.body;

    if (!userId || !password || !wabaNumber || !templateName) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, password, wabaNumber, or templateName' 
      });
    }

    logToFile('=== DELETE TEMPLATE API REQUEST DETAILS ===');
    logToFile(`User ID: ${userId}`);
    logToFile(`WhatsApp Number: ${wabaNumber}`);
    logToFile(`Template Name: ${templateName}`);
    logToFile(`Language: ${language || 'en'}`);
    logToFile('==========================================');

    // Build URL with query parameters
    const url = new URL('https://theultimate.io/WAApi/template');
    url.searchParams.append('userid', userId);
    url.searchParams.append('password', password);
    url.searchParams.append('wabaNumber', wabaNumber);
    url.searchParams.append('output', 'json');
    url.searchParams.append('templateName', templateName);
    url.searchParams.append('language', language || 'en');

    logToFile(`Making DELETE request to: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logToFile(`API Error: ${errorText}`);
      return res.status(response.status).json({ 
        error: `HTTP error! status: ${response.status}`,
        details: errorText
      });
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text();
    logToFile(`API Response Text: ${responseText}`);
    
    if (!responseText || responseText.trim() === '') {
      logToFile('API returned empty response');
      return res.status(400).json({ 
        error: 'Empty response from API',
        details: 'The API returned an empty response'
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logToFile(`JSON Parse Error: ${parseError.message}`);
      logToFile(`Response that failed to parse: ${responseText}`);
      return res.status(400).json({ 
        error: 'Invalid JSON response from API',
        details: responseText.substring(0, 500) // First 500 chars of response
      });
    }
    
    if (data.status === 'success') {
      return res.json({
        success: true,
        message: 'Template deleted successfully',
        template: data
      });
    } else {
      return res.status(400).json({ 
        error: data.reason || 'Failed to delete template',
        apiResponse: data
      });
    }

  } catch (error) {
    logToFile(`Delete template error: ${error.message}`);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Proxy endpoint for uploading media
app.post('/api/upload-media', async (req, res) => {
  try {
    const { userId, wabaNumber, mediaType, identifier, description, mediaFile } = req.body;
    
    if (!userId || !wabaNumber || !mediaType || !identifier || !mediaFile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logToFile('=== UPLOAD MEDIA API REQUEST DETAILS ===');
    logToFile(`User ID: ${userId}`);
    logToFile(`WhatsApp Number: ${wabaNumber}`);
    logToFile(`Media Type: ${mediaType}`);
    logToFile(`Identifier: ${identifier}`);
    logToFile(`Description: ${description || 'N/A'}`);
    logToFile('========================================');

    // Get API key and password from database
    const { data: clientData, error: clientError } = await supabase
      .from('client_users')
      .select('whatsapp_api_key, password')
      .eq('user_id', userId)
      .single();

    if (clientError || !clientData) {
      return res.status(400).json({ error: 'Failed to get client credentials' });
    }

    const apiKey = clientData.whatsapp_api_key;
    const password = clientData.password;

    // Create FormData for the WhatsApp API using form-data library
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
      
      // Append buffer directly to FormData using form-data library
      formData.append('mediaFile', buffer, {
        filename: `${identifier}${extension}`,
        contentType: mediaType === 'image' ? 'image/jpeg' : 
                    mediaType === 'video' ? 'video/mp4' : 
                    mediaType === 'audio' ? 'audio/mpeg' : 
                    mediaType === 'document' ? 'application/pdf' : 
                    'application/octet-stream'
      });
    } else {
      // Handle file path or URL
      formData.append('mediaFile', mediaFile);
    }

    const response = await fetch('https://theultimate.io/WAApi/media', {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1'
      },
      body: formData
    });

    const responseText = await response.text();
    logToFile(`API Response Text: ${responseText}`);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to upload media', details: responseText });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return res.status(500).json({ error: 'Invalid JSON response', details: responseText });
    }

    if (data.status === 'success') {
      // Get the client_id (from clients table) for this user
      let clientOrgId = userId;
      try {
        const { data: clientUserData, error: clientUserError } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('user_id', userId)
          .single();
        
        if (!clientUserError && clientUserData?.client_id) {
          clientOrgId = clientUserData.client_id;
          console.log('Retrieved client_id from database:', clientOrgId);
        }
      } catch (error) {
        console.error('Error fetching client_id:', error);
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

      res.json({ success: true, message: 'Media uploaded successfully', media: data });
    } else {
      res.status(400).json({ error: data.reason || 'Failed to upload media', apiResponse: data });
    }

  } catch (error) {
    logToFile(`Upload media error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Proxy endpoint for deleting media
app.delete('/api/delete-media', async (req, res) => {
  try {
    const { userId, mediaId } = req.body;
    
    if (!userId || !mediaId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logToFile('=== DELETE MEDIA API REQUEST DETAILS ===');
    logToFile(`User ID: ${userId}`);
    logToFile(`Media ID: ${mediaId}`);
    logToFile('========================================');

    // Get API key from database
    const { data: clientData, error: clientError } = await supabase
      .from('client_users')
      .select('whatsapp_api_key')
      .eq('user_id', userId)
      .single();

    if (clientError || !clientData) {
      return res.status(400).json({ error: 'Failed to get client credentials' });
    }

    const apiKey = clientData.whatsapp_api_key;

    const url = `https://theultimate.io/WAApi/media?userid=${userId}&output=json&mediaId=${mediaId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1'
      }
    });

    const responseText = await response.text();
    logToFile(`API Response Text: ${responseText}`);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to delete media', details: responseText });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return res.status(500).json({ error: 'Invalid JSON response', details: responseText });
    }

    if (data.status === 'success') {
      res.json({ success: true, message: 'Media deleted successfully', media: data });
    } else {
      res.status(400).json({ error: data.reason || 'Failed to delete media', apiResponse: data });
    }

  } catch (error) {
    logToFile(`Delete media error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Proxy endpoint for downloading media
app.get('/api/download-media', async (req, res) => {
  try {
    const { userId, mediaId } = req.query;
    
    if (!userId || !mediaId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logToFile('=== DOWNLOAD MEDIA API REQUEST DETAILS ===');
    logToFile(`User ID: ${userId}`);
    logToFile(`Media ID: ${mediaId}`);
    logToFile('==========================================');

    // Get API key from database
    const { data: clientData, error: clientError } = await supabase
      .from('client_users')
      .select('whatsapp_api_key')
      .eq('user_id', userId)
      .single();

    if (clientError || !clientData) {
      return res.status(400).json({ error: 'Failed to get client credentials' });
    }

    const apiKey = clientData.whatsapp_api_key;

    const url = `https://theultimate.io/WAApi/media?userid=${userId}&output=json&mediaId=${mediaId}&download=true`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'Failed to download media', details: errorText });
    }

    // Get the content type and filename from headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition') || '';
    const filename = contentDisposition.includes('filename=') 
      ? contentDisposition.split('filename=')[1].replace(/"/g, '') 
      : `media_${mediaId}`;

    // Get the file buffer
    const buffer = await response.arrayBuffer();

    // Set appropriate headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.byteLength);

    // Send the file
    res.send(Buffer.from(buffer));

  } catch (error) {
    logToFile(`Download media error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Proxy endpoint for wallet balance API
app.post('/api/fetch-wallet-balance', async (req, res) => {
  try {
    const { userId, apiKey } = req.body;

    if (!userId || !apiKey) {
      return res.status(400).json({ error: 'Missing userId or apiKey' });
    }

    logToFile('=== WALLET BALANCE API REQUEST DETAILS ===');
    logToFile(`User ID: ${userId}`);
    logToFile(`API Key: ${apiKey ? '***' + apiKey.slice(-4) : 'NOT_SET'}`);
    logToFile(`Full URL: https://theultimate.io/SMSApi/account/readstatus?userid=${userId}&output=json`);
    logToFile('==========================================');

    const response = await fetch(`https://theultimate.io/SMSApi/account/readstatus?userid=${userId}&output=json`, {
      method: 'GET',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'PHPSESSID=m2s8rvll7rbjkhjk0jno1gb01t; SERVERNAME=s1'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logToFile(`API Error: ${errorText}`);
      return res.status(response.status).json({ 
        error: `HTTP error! status: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (data.response && data.response.status === 'success') {
      return res.json({
        success: true,
        balance: data.response.account,
        message: 'Wallet balance fetched successfully'
      });
    } else {
      return res.status(400).json({ 
        error: data.response?.msg || 'Failed to fetch wallet balance',
        apiResponse: data
      });
    }

  } catch (error) {
    logToFile(`Proxy error: ${error.message}`);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  logToFile(`Proxy server running on http://localhost:${PORT}`);
}); 