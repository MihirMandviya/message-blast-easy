// Vercel serverless function for creating templates
// This replaces the proxy server's /api/create-template endpoint

export default async function handler(req, res) {
  // Enable CORS with more comprehensive headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Log request details (without sensitive data)
    console.log('=== CREATE TEMPLATE API REQUEST DETAILS ===');
    console.log(`User ID: ${userId}`);
    console.log(`API Key: ***${apiKey.slice(-4)}`);
    console.log(`WhatsApp Number: ${wabaNumber}`);
    console.log(`Template Name: ${templateName}`);
    console.log(`Template Description: ${templateDescription}`);
    console.log(`Language: ${language}`);
    console.log(`Category: ${category}`);
    console.log(`Message Type: ${msgType}`);
    console.log(`Header: ${header}`);
    console.log(`Body: ${body}`);
    console.log(`Footer: ${footer}`);
    console.log(`Buttons: ${buttons ? JSON.stringify(buttons) : 'NONE'}`);
    console.log(`Media Type: ${mediaType}`);
    console.log('==========================================');

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
      console.log('Processing media template with headerFile:', headerFile);
      if (headerFile && headerFile.trim()) {
        // Extract mediaId from the URL if it's a download URL
        const urlMatch = headerFile.match(/mediaId=(\d+)/);
        console.log('URL match result:', urlMatch);
        if (urlMatch && urlMatch[1]) {
          const mediaId = urlMatch[1];
          formData.append('mediaId', mediaId);
          console.log(`Media template - mediaId added: ${mediaId}`);
        } else {
          // If it's a direct URL, use mediaUrl
          formData.append('mediaUrl', headerFile.trim());
          console.log(`Media template - mediaUrl added: ${headerFile.trim()}`);
        }
        
        // Debug: Log all FormData entries
        console.log('=== FORM DATA CONTENTS ===');
        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }
        console.log('==========================');
      } else {
        console.log('Media template - no headerFile provided, this will cause an error');
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
      console.log(`API Error: ${errorText}`);
      return res.status(response.status).json({ 
        error: `HTTP error! status: ${response.status}`,
        details: errorText
      });
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text();
    console.log(`API Response Text: ${responseText}`);
    
    if (!responseText || responseText.trim() === '') {
      console.log('API returned empty response');
      return res.status(400).json({ 
        error: 'Empty response from API',
        details: 'The API returned an empty response'
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log(`JSON Parse Error: ${parseError.message}`);
      console.log(`Response that failed to parse: ${responseText}`);
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
    console.error(`Proxy error: ${error.message}`);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}
