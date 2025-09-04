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
    const { userId, fromDate, toDate, mobileNo, pageLimit, startCursor } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://vvpamvhqdyanomqvtmiz.supabase.co";
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cGFtdmhxZHlhbm9tcXZ0bWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Njc5NTYsImV4cCI6MjA2ODI0Mzk1Nn0.Jq1ek02FHiTOx9m8hQzX9Gh8bmOMzWSJ2YtJIzKg3ZQ";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch credentials from database
    const { data: clientData, error: clientError } = await supabase
      .from('client_users')
      .select('password, whatsapp_number')
      .eq('user_id', userId)
      .single();

    if (clientError || !clientData) {
      console.error('Database error:', clientError?.message || 'Client not found');
      return res.status(400).json({ error: 'Failed to get client credentials from database' });
    }

    const { password, whatsapp_number: wabaNumber } = clientData;

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
