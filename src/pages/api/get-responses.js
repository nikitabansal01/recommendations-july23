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
  if (req.method !== 'GET') {
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
    const { responseId } = req.query;
    if (responseId) {
      // 단일 응답 조회
      const responseData = await redis.get(responseId);
      if (responseData) {
        return res.status(200).json({ success: true, response: responseData });
      } else {
        return res.status(404).json({ success: false, message: 'Response not found' });
      }
    }

    console.log('Fetching all responses...');

    // Get the list of response IDs
    const responseIds = await redis.lrange('responses', 0, -1);
    console.log(`Found ${responseIds.length} response IDs`);
    
    // Fetch all response data
    const responses = [];
    for (const id of responseIds) {
      try {
      const responseData = await redis.get(id);
      if (responseData) {
        responses.push(responseData);
      }
      } catch (error) {
        console.error(`Error fetching response ${id}:`, error);
      }
    }

    // Sort responses by timestamp (newest first)
    responses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log(`Successfully fetched ${responses.length} responses`);

    res.status(200).json({ 
      success: true, 
      responses,
      count: responses.length,
      message: 'Responses fetched successfully' 
    });

  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch responses',
      error: error.message,
      debug: {
        urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    });
  }
} 