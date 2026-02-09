// Vercel Serverless Function - Proxy for Offers
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

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const n8nOffersUrl = process.env.N8N_OFFERS_WEBHOOK_URL || 'https://ritik-n8n-e9673da43cf4.herokuapp.com/webhook/get-offers';
    
    console.log('Proxying offers request to n8n:', n8nOffersUrl);
    
    // Forward the request to n8n
    const response = await fetch(n8nOffersUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    console.log('n8n offers response:', data);
    
    // Return the response from n8n
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Offers proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch offers',
      details: error.message 
    });
  }
}
