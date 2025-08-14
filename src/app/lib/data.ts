import { Redis } from '@upstash/redis';
import { SurveyResponses } from '../types/SurveyResponses';
import { ResultsSummary } from '../types/ResultsSummary';
import { RecommendationResult, UserProfile } from '../types/ResearchData';

// Initialize Redis client
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

// Local storage for development (shared with chatbot context)
// This should be imported from the shared storage module
import { getGlobalStorage } from './local-storage';

// Use global storage instance
const storage = getGlobalStorage();

export async function getResponseData(responseId: string) {
  if (redis) {
    // Use Redis if available
  const responseData = await redis.get(responseId);
  if (!responseData) {
    throw new Error('Response not found');
  }
  console.log('getResponseData: loaded from Redis:', responseData);
  return responseData as {
    id: string;
    surveyData: SurveyResponses;
    results: ResultsSummary;
    email: string | null;
    timestamp: string;
    createdAt: string;
  };
  } else {
    // Use local storage for development
    const responseData = storage.getResponse(responseId);
    if (!responseData) {
      throw new Error('Response not found');
    }
    console.log('getResponseData: loaded from local storage:', responseData);
    return {
      id: responseData.id,
      surveyData: responseData.surveyData as unknown as SurveyResponses,
      results: responseData.results as unknown as ResultsSummary,
      email: responseData.email,
      timestamp: responseData.timestamp,
      createdAt: responseData.createdAt
    };
  }
}

export async function getAllResponses() {
  if (redis) {
    // Use Redis if available
  const responseIds = await redis.lrange('responses', 0, -1);
  const responses: Array<{
    id: string;
    surveyData: SurveyResponses;
    results: ResultsSummary;
    email: string | null;
    timestamp: string;
    createdAt: string;
  }> = [];

  for (const id of responseIds) {
    try {
      const responseData = await redis.get(id);
      if (responseData) {
        responses.push(responseData as {
          id: string;
          surveyData: SurveyResponses;
          results: ResultsSummary;
          email: string | null;
          timestamp: string;
          createdAt: string;
        });
      }
    } catch (error) {
      console.error(`Error fetching response ${id}:`, error);
    }
  }

  // Sort by timestamp (newest first)
  responses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return responses;
  } else {
    // Use local storage for development
    const allResponses = storage.getAllResponses();
    return allResponses.map(responseData => ({
      id: responseData.id,
      surveyData: responseData.surveyData as unknown as SurveyResponses,
      results: responseData.results as unknown as ResultsSummary,
      email: responseData.email,
      timestamp: responseData.timestamp,
      createdAt: responseData.createdAt
    }));
  }
}

export async function generateRecommendations(responseData: {
  surveyData: SurveyResponses;
  results: ResultsSummary;
}): Promise<RecommendationResult | null> {
  try {
    const { surveyData, results } = responseData;
    
    const userProfile: UserProfile = {
      hormoneScores: results.analysis?.scores || {
        androgens: 0, progesterone: 0, estrogen: 0, thyroid: 0, cortisol: 0, insulin: 0
      },
      primaryImbalance: results.analysis?.primaryImbalance || '',
      secondaryImbalances: results.analysis?.secondaryImbalances || [],
      conditions: surveyData.q10_conditions || [],
      symptoms: surveyData.q4_symptoms || [],
      cyclePhase: results.cyclePhase || 'unknown',
      birthControlStatus: surveyData.q9_birth_control || 'No',
      age: surveyData.age,
      ethnicity: surveyData.ethnicity,
      cravings: surveyData.q7_cravings || [],
      confidence: results.confidenceLevel || 'low'
    };

    const categories: ('food' | 'movement' | 'mindfulness')[] = ['food', 'movement', 'mindfulness'];
    const recResult: RecommendationResult = {
      food: [], movement: [], mindfulness: [], userProfile, generatedAt: new Date().toISOString()
    };

    // Generate recommendations for each category
    for (const category of categories) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/llm-recommendations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userProfile, category })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.recommendations) {
            recResult[category] = data.recommendations;
          }
        }
      } catch (error) {
        console.error(`Error generating ${category} recommendations:`, error);
      }
    }

    return recResult;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return null;
  }
}

export async function getResponseCounts() {
  if (redis) {
    // Use Redis if available
  try {
    const withEmail = await redis.get('with_email_count') || 0;
    const withoutEmail = await redis.get('no_email_count') || 0;
    
    return {
      withEmail: Number(withEmail),
      withoutEmail: Number(withoutEmail)
    };
  } catch (error) {
    console.error('Error getting response counts:', error);
      return { withEmail: 0, withoutEmail: 0 };
    }
  } else {
    // Use local storage for development
    return { withEmail: 0, withoutEmail: 0 };
  }
} 