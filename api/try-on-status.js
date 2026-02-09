// Vercel Serverless Function - Proxy for Try-On Status Polling
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const n8nStatusUrl = process.env.N8N_TRY_ON_STATUS_URL || 'https://ritik-n8n-e9673da43cf4.herokuapp.com/webhook/webhook/try-on-status';
    const fullUrl = `${n8nStatusUrl}?userId=${userId}`;
    
    console.log('Polling try-on status from n8n:', fullUrl);
    
    // Forward the request to n8n
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log('n8n status response:', data);
    
    // Return the response from n8n
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Status polling error:', error);
    res.status(500).json({ 
      error: 'Failed to check generation status',
      details: error.message 
    });
  }
}
