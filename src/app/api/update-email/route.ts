import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

export async function PATCH(request: NextRequest) {
  if (!redis) {
    return NextResponse.json({ message: 'Redis not available' }, { status: 500 });
  }
  
  try {
    const { responseId, email } = await request.json();
    
    if (!responseId || !email) {
      return NextResponse.json({ message: 'Missing responseId or email' }, { status: 400 });
    }
    
    const responseData = await redis.get(responseId) as { email?: string } | null;
    if (!responseData) {
      return NextResponse.json({ message: 'Response not found' }, { status: 404 });
    }
    
    // 이미 이메일이 있으면 카운트 변경 안함
    if (!responseData.email) {
      await redis.incr('with_email_count');
      await redis.decr('no_email_count');
    }
    
    responseData.email = email;
    await redis.set(responseId, responseData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      message: 'Failed to update email', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 