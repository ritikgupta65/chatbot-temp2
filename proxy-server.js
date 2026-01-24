// Simple CORS proxy server to bypass CORS restrictions during development
// Run this with: node proxy-server.js

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy endpoint
app.post('/proxy/try-on', async (req, res) => {
  const WEBHOOK_URL = 'https://ritik-n8n-e9673da43cf4.herokuapp.com/webhook/2598d12d-a13f-4759-ae5b-1e0262e33b9c';
  
  try {
    console.log('Received proxy request for try-on generation');
    console.log('Payload size:', JSON.stringify(req.body).length, 'bytes');
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    console.log('Webhook response status:', response.status);
    const contentType = response.headers.get('content-type') || '';
    console.log('Webhook response content-type:', contentType);

    // Forward all headers from the original response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.set(key, value);
      }
    });

    // Check if response is an image (binary)
    if (contentType.includes('image/')) {
      console.log('Forwarding binary image response');
      const buffer = await response.arrayBuffer();
      console.log('Image size:', buffer.byteLength, 'bytes');
      res.set('Content-Type', contentType);
      res.send(Buffer.from(buffer));
    } else {
      // Handle JSON response - pass it through as-is
      console.log('Forwarding JSON response');
      const text = await response.text();
      console.log('Response preview:', text.substring(0, 200) + '...');
      res.set('Content-Type', 'application/json');
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Forwarding requests to n8n webhook`);
});
