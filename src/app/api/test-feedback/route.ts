import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

// Initialize Redis client
try {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('Redis environment variables not set');
  } else {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

export async function GET(request: NextRequest) {
  try {
    const testData = {
      id: `test_feedback_${Date.now()}`,
      responseId: 'test_response_123',
      understanding: 'Yes',
      helpfulPart: 'Test feedback',
      unclearPart: '',
      wouldShare: 'Yes',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    if (!redis) {
      return NextResponse.json({
        success: false,
        message: 'Redis not available',
        debug: {
          redisAvailable: false,
          environmentVariables: {
            urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
            tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
          }
        }
      });
    }

    // Test saving to Redis
    console.log('Testing Redis connection...');
    await redis.set(`feedback:${testData.id}`, JSON.stringify(testData));
    console.log('Test data saved to Redis successfully');

    // Test retrieving from Redis
    const retrievedData = await redis.get(`feedback:${testData.id}`);
    console.log('Test data retrieved from Redis:', retrievedData);

    // Clean up test data
    await redis.del(`feedback:${testData.id}`);

    return NextResponse.json({
      success: true,
      message: 'Redis connection working',
      testData: retrievedData,
      debug: {
        redisAvailable: true,
        environmentVariables: {
          urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
          tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
        }
      }
    });

  } catch (error) {
    console.error('Redis test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Redis test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        redisAvailable: false,
        environmentVariables: {
          urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
          tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
        }
      }
    }, { status: 500 });
  }
}

