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

export async function POST(request: NextRequest) {
  try {
    const { responseId, feedback } = await request.json();

    if (!responseId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate feedback data
    if (!feedback.understanding) {
      return NextResponse.json(
        { error: 'Understanding field is required' },
        { status: 400 }
      );
    }

    const feedbackData = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      responseId,
      understanding: feedback.understanding,
      helpfulPart: feedback.helpfulPart || '',
      unclearPart: feedback.unclearPart || '',
      wouldShare: feedback.wouldShare || '',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    if (redis) {
      // Save to Redis
      console.log('Saving feedback to Redis:', feedbackData);
      console.log('Feedback key:', `feedback:${feedbackData.id}`);
      await redis.set(`feedback:${feedbackData.id}`, JSON.stringify(feedbackData));
      console.log('Feedback saved to Redis successfully');
      
      // Verify it was saved
      const savedFeedback = await redis.get(`feedback:${feedbackData.id}`);
      console.log('Verification - saved feedback:', savedFeedback);
      
      // Also update the original response with full feedback data
      const existingResponse = await redis.get(responseId);
      if (existingResponse) {
        // existingResponse is already an object, no need to parse
        const responseData = typeof existingResponse === 'string' 
          ? JSON.parse(existingResponse) 
          : existingResponse;
        
        // Add full feedback data to the response
        responseData.feedback = {
          id: feedbackData.id,
          understanding: feedbackData.understanding,
          helpfulPart: feedbackData.helpfulPart,
          unclearPart: feedbackData.unclearPart,
          wouldShare: feedbackData.wouldShare,
          timestamp: feedbackData.timestamp,
          createdAt: feedbackData.createdAt
        };
        responseData.feedbackId = feedbackData.id;
        responseData.feedbackSubmitted = true;
        
        await redis.set(responseId, JSON.stringify(responseData));
        console.log('Updated original response with full feedback data');
      } else {
        console.log('Original response not found for feedback reference update');
      }
    } else {
      // Redis not available - return error
      console.error('Redis not available - cannot save feedback');
      return NextResponse.json(
        { 
          error: 'Database connection not available. Cannot save feedback.',
          debug: {
            redisAvailable: false,
            environmentVariables: {
              urlSet: !!process.env.UPSTASH_REDIS_REST_URL,
              tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN
            }
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedbackData.id,
      message: 'Feedback saved successfully'
    });

  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
