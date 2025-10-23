import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { generateDualTimestamps } from '../../lib/timestampUtils';

// Initialize Upstash Redis client with error handling
let redis: Redis | null = null;

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

export async function POST(request: NextRequest) {
  // Check if Redis is available
  if (!redis) {
    console.error('Redis client not available');
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection not available. Please check environment variables.',
      debug: {
        urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        error: 'Redis client initialization failed'
      }
    }, { status: 500 });
  }

  try {
    const { surveyData, results, email, timestamp } = await request.json();

    if (!surveyData || !results) {
      return NextResponse.json({ message: 'Missing required data' }, { status: 400 });
    }

    // Generate a unique ID for this response
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save the response data
    const timestamps = generateDualTimestamps();
    const responseData = {
      id: responseId,
      surveyData,
      results,
      email: email || null,
      timestamp: timestamp || timestamps.timestamp, // Use provided timestamp or generate new one
      ...timestamps
    };

    // 저장될 데이터 콘솔 출력
    console.log('save-response: responseData to save:', responseData);

    console.log('Attempting to save response:', responseId);

    // Store in Upstash Redis
    await redis.set(responseId, responseData);
    console.log('Response saved successfully');
    
    // Also store in a list for easy retrieval
    await redis.lpush('responses', responseId);
    console.log('Response ID added to list');

    // 이메일 카운트 관리
    if (!email) {
      await redis.incr('no_email_count');
    } else {
      await redis.incr('with_email_count');
    }

    return NextResponse.json({ 
      success: true, 
      responseId,
      message: 'Response saved successfully' 
    });

  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to save response',
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    }, { status: 500 });
  }
} 