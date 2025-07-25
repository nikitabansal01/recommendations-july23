import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Environment variables debug',
    upstashUrl: process.env.UPSTASH_REDIS_REST_URL ? 'Set' : 'Not set',
    upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set' : 'Not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
} 