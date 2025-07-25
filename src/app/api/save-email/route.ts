import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client with error handling
let redis: Redis | null = null;

try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

export async function POST(request: NextRequest) {
  // Check if Redis is available
  if (!redis) {
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection not available. Please check environment variables.' 
    }, { status: 500 });
  }

  try {
    const { email, responseId, timestamp } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    // Generate a unique ID for this email entry
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save the email data
    const emailData = {
      id: emailId,
      email,
      responseId: responseId || null,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Store in Upstash Redis
    await redis.set(emailId, emailData);
    
    // Also store in a list for easy retrieval
    await redis.lpush('emails', emailId);

    // If there's a responseId, link the email to the response
    if (responseId) {
      await redis.hset(`response_emails:${responseId}`, { email });
    }

    return NextResponse.json({ 
      success: true, 
      emailId,
      message: 'Email saved successfully' 
    });

  } catch (error) {
    console.error('Error saving email:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to save email',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    }, { status: 500 });
  }
} 