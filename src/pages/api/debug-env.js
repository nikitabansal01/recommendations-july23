export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Environment variables debug',
    upstashUrl: process.env.UPSTASH_REDIS_REST_URL ? 'Set' : 'Not set',
    upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set' : 'Not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
} 