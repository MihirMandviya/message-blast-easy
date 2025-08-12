import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import fs from 'fs';

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
    
    // For media templates, include headerFile parameter only if provided
    if (msgType === 'media') {
      if (headerSampleFile || req.body.headerFile) {
        const headerFile = headerSampleFile || req.body.headerFile;
        formData.append('headerFile', headerFile);
        logToFile(`Media template - headerFile: ${headerFile}`);
      } else {
        logToFile('Media template - no headerFile provided, sending only mediaType');
      }
    }

    const response = await fetch('https://theultimate.io/WAApi/template', {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1'
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