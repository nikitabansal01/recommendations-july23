import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
let redis: Redis | null = null;

try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

export async function GET() {
  try {
    // Check if Redis is available
    if (!redis) {
      return NextResponse.json({ 
        success: false, 
        message: 'Redis client not available',
        debug: {
          urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
          tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN,
          url: process.env.UPSTASH_REDIS_REST_URL ? 'Set' : 'Not set',
          token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set' : 'Not set'
        }
      }, { status: 500 });
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

    return NextResponse.json({ 
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
    return NextResponse.json({ 
      success: false, 
      message: 'Redis connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    }, { status: 500 });
  }
} 