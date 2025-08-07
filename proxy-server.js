import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for media API
app.post('/api/fetch-media', async (req, res) => {
  try {
    const { userId, apiKey } = req.body;

    if (!userId || !apiKey) {
      return res.status(400).json({ error: 'Missing userId or apiKey' });
    }

    console.log('Proxying media request for userId:', userId);

    const response = await fetch(`https://theultimate.io/WAApi/media?userid=${userId}&output=json`, {
      method: 'GET',
      headers: {
        'apiKey': apiKey,
        'Cookie': 'SERVERID=webC1'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
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
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Proxy endpoint for templates API
app.post('/api/fetch-templates', async (req, res) => {
  try {
    const { userId, password, wabaNumber } = req.body;

    if (!userId || !password || !wabaNumber) {
      return res.status(400).json({ error: 'Missing userId, password, or wabaNumber' });
    }

    console.log('Proxying templates request for userId:', userId);

    const response = await fetch(`https://theultimate.io/WAApi/template?userid=${userId}&password=${password}&wabaNumber=${wabaNumber}&output=json`, {
      method: 'GET',
      headers: {
        'Cookie': 'SERVERID=webC1'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
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
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
}); 