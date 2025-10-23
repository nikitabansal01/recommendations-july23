import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { generateDualTimestamps } from '../../lib/timestampUtils';

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
    if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating' },
        { status: 400 }
      );
    }

    const timestamps = generateDualTimestamps();
    const feedbackData = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      responseId,
      rating: feedback.rating,
      comments: feedback.comments || '',
      experience: feedback.experience || '',
      improvements: feedback.improvements || '',
      ...timestamps
    };

    if (redis) {
      // Save to Redis
      await redis.set(`feedback:${feedbackData.id}`, JSON.stringify(feedbackData));
      
      // Also update the original response with feedback reference
      const existingResponse = await redis.get(`response:${responseId}`);
      if (existingResponse) {
        const responseData = JSON.parse(existingResponse as string);
        responseData.feedbackId = feedbackData.id;
        responseData.feedbackSubmitted = true;
        await redis.set(`response:${responseId}`, JSON.stringify(responseData));
      }
    } else {
      // Mock mode - save to localStorage (for local testing)
      console.log('Mock mode: Feedback would be saved to database:', feedbackData);
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
