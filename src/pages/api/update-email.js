import { Redis } from '@upstash/redis';

let redis;
try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  if (!redis) {
    return res.status(500).json({ message: 'Redis not available' });
  }
  try {
    const { responseId, email } = req.body;
    if (!responseId || !email) {
      return res.status(400).json({ message: 'Missing responseId or email' });
    }
    const responseData = await redis.get(responseId);
    if (!responseData) {
      return res.status(404).json({ message: 'Response not found' });
    }
    // 이미 이메일이 있으면 카운트 변경 안함
    if (!responseData.email) {
      await redis.incr('with_email_count');
      await redis.decr('no_email_count');
    }
    responseData.email = email;
    await redis.set(responseId, responseData);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update email', error: error.message });
  }
} 