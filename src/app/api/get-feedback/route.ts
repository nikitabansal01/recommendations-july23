import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

// Initialize Redis client
try {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('Redis environment variables not set, using mock mode');
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
    if (!redis) {
      return NextResponse.json({
        success: false,
        message: 'Database connection not available',
        feedback: []
      });
    }

    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get('responseId');
    
    if (responseId) {
      // Get feedback for specific response
      const responseData = await redis.get(`response:${responseId}`);
      if (responseData) {
        const parsed = JSON.parse(responseData as string);
        if (parsed.feedbackId) {
          const feedbackData = await redis.get(`feedback:${parsed.feedbackId}`);
          if (feedbackData) {
            return NextResponse.json({
              success: true,
              feedback: [JSON.parse(feedbackData as string)]
            });
          }
        }
        return NextResponse.json({
          success: true,
          feedback: []
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Response not found'
        }, { status: 404 });
      }
    }

    // Get all feedback data
    console.log('Fetching all feedback...');
    
    // Get all feedback keys
    const feedbackKeys = await redis.keys('feedback:*');
    console.log(`Found ${feedbackKeys.length} feedback entries`);
    
    const allFeedback = [];
    for (const key of feedbackKeys) {
      try {
        const feedbackData = await redis.get(key);
        if (feedbackData) {
          allFeedback.push(JSON.parse(feedbackData as string));
        }
      } catch (error) {
        console.error(`Error fetching feedback ${key}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    allFeedback.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log(`Successfully fetched ${allFeedback.length} feedback entries`);

    return NextResponse.json({
      success: true,
      feedback: allFeedback,
      count: allFeedback.length
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
