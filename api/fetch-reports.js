export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, password, wabaNumber, fromDate, toDate, mobileNo, pageLimit, startCursor } = req.body;

    if (!userId || !password || !wabaNumber) {
      return res.status(400).json({ error: 'Missing required fields: userId, password, wabaNumber' });
    }

    // Create form data
    const formData = new URLSearchParams();
    formData.append('userid', userId);
    formData.append('password', password);
    formData.append('wabaNumber', wabaNumber);
    formData.append('fromDate', fromDate || '');
    formData.append('toDate', toDate || '');
    formData.append('mobileNo', mobileNo || '');
    formData.append('pageLimit', pageLimit || '100');
    formData.append('startCursor', startCursor || '1');

    const response = await fetch('https://theultimate.io/WAApi/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'SERVERID=webC1'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'success') {
      res.status(200).json({
        success: true,
        data: data.data,
        message: data.msg
      });
    } else {
      res.status(400).json({
        success: false,
        error: data.msg || 'Failed to fetch reports'
      });
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
