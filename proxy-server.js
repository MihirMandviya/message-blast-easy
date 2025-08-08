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

app.listen(PORT, () => {
  logToFile(`Proxy server running on http://localhost:${PORT}`);
}); 