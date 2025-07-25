import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

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

interface ResponseData {
  id: string;
  surveyData: Record<string, unknown>;
  results: Record<string, unknown>;
  email: string | null;
  timestamp: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get('responseId');
    
    if (responseId) {
      // 단일 응답 조회
      const responseData = await redis.get(responseId);
      if (responseData) {
        console.log('get-responses: loaded responseData:', responseData);
        return NextResponse.json({ success: true, response: responseData });
      } else {
        return NextResponse.json({ success: false, message: 'Response not found' }, { status: 404 });
      }
    }

    console.log('Fetching all responses...');

    // Get the list of response IDs
    const responseIds = await redis.lrange('responses', 0, -1);
    console.log(`Found ${responseIds.length} response IDs`);
    
    // Fetch all response data
    const responses: ResponseData[] = [];
    for (const id of responseIds) {
      try {
        const responseData = await redis.get(id);
        if (responseData) {
          responses.push(responseData as ResponseData);
        }
      } catch (error) {
        console.error(`Error fetching response ${id}:`, error);
      }
    }

    // Sort responses by timestamp (newest first)
    responses.sort((a: ResponseData, b: ResponseData) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log(`Successfully fetched ${responses.length} responses`);

    return NextResponse.json({ 
      success: true, 
      responses,
      count: responses.length,
      message: 'Responses fetched successfully' 
    });

  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch responses',
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    }, { status: 500 });
  }
} 