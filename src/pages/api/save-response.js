// Example of using Unstash (currently using Vercel KV)
// import { kv } from '@vercel/kv';

// To change to Unstash:
// import { Unstash } from 'unstash';

import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client with error handling
let redis;
try {
  console.log('Initializing Redis client...');
  console.log('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? 'Set' : 'Not set');
  console.log('UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set' : 'Not set');
  
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Missing Upstash environment variables');
  }
  
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('Redis client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check if Redis is available
  if (!redis) {
    console.error('Redis client not available');
    return res.status(500).json({ 
      success: false, 
      message: 'Database connection not available. Please check environment variables.',
      debug: {
        urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        error: 'Redis client initialization failed'
      }
    });
  }

  try {
    const { surveyData, results, timestamp } = req.body;

    if (!surveyData || !results) {
      return res.status(400).json({ message: 'Missing required data' });
    }

    // Generate a unique ID for this response
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save the response data
    const responseData = {
      id: responseId,
      surveyData,
      results,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    console.log('Attempting to save response:', responseId);

    // Store in Upstash Redis
    await redis.set(responseId, responseData);
    console.log('Response saved successfully');
    
    // Also store in a list for easy retrieval
    await redis.lpush('responses', responseId);
    console.log('Response ID added to list');

    // When using Unstash:
    // const unstash = new Unstash(process.env.UNSTASH_TOKEN);
    // await unstash.set(responseId, responseData);
    // await unstash.lpush('responses', responseId);

    res.status(200).json({ 
      success: true, 
      responseId,
      message: 'Response saved successfully' 
    });

  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save response',
      error: error.message,
      debug: {
        urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    });
  }
} 