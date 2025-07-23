import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
let redis;
try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if Redis is available
    if (!redis) {
      return res.status(500).json({ 
        success: false, 
        message: 'Redis client not available',
        debug: {
          urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
          tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN,
          url: process.env.UPSTASH_REDIS_REST_URL ? 'Set' : 'Not set',
          token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set' : 'Not set'
        }
      });
    }

    // Test Redis connection
    const testKey = 'test_connection';
    const testValue = { message: 'Hello from Upstash Redis!', timestamp: new Date().toISOString() };
    
    // Try to set a test value
    await redis.set(testKey, testValue);
    console.log('Test value set successfully');
    
    // Try to get the test value
    const retrievedValue = await redis.get(testKey);
    console.log('Test value retrieved successfully');
    
    // Clean up
    await redis.del(testKey);
    console.log('Test value cleaned up');

    res.status(200).json({ 
      success: true, 
      message: 'Redis connection test successful',
      testValue: retrievedValue,
      debug: {
        urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    });

  } catch (error) {
    console.error('Redis test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Redis connection test failed',
      error: error.message,
      debug: {
        urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    });
  }
} 