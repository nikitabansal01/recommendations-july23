import { NextRequest, NextResponse } from 'next/server';
import { UserProfile } from '../../types/ResearchData';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function callOpenAI(prompt: string): Promise<string> {
  if (!prompt) {
    console.error('OpenAI 프롬프트가 undefined/null입니다:', prompt);
    return '';
  }
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1800
      })
    });
    if (!response.ok) {
      console.error('OpenAI API fetch 실패:', response.status, await response.text());
      return '';
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    console.error('OpenAI fetch 에러:', e);
    return '';
  }
}

async function callGroq(prompt: string): Promise<string> {
  if (!prompt) {
    console.error('Groq 프롬프트가 undefined/null입니다:', prompt);
    return '';
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        // Groq 지원 모델 옵션들 (최신 확인된 모델들):
        // 'llama-3.1-8b-instant'     // 빠른 응답, 일반적인 작업
        // 'llama-3.3-70b-versatile'  // 최신 모델, 고품질 (추천)
        // 'mixtral-8x7b-32768'       // 기존 사용 모델
        // 'gemma-2-9b-it'            // 빠르고 효율적
        model: 'llama-3.3-70b-versatile', // 최신 지원 모델, 의료 추천 시스템에 적합
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1800
      })
    });
    if (!response.ok) {
      console.error('Groq API fetch 실패:', response.status, await response.text());
      return '';
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    console.error('Groq fetch 에러:', e);
    return '';
  }
}

interface Recommendation {
  title?: string;
  specificAction?: string;
  category?: string;
  researchBacking?: {
    summary: string;
    studies: unknown[];
  };
  contraindications?: unknown[];
  frequency?: string;
  expectedTimeline?: string;
  priority?: string;
}

function parseRecommendationsFromLLM(llmResponse: string, category: string): Recommendation[] {
  // LLM이 반환한 JSON 배열을 파싱
  try {
    console.log('LLM 원본 응답:', llmResponse);
    
    // JSON 배열 찾기 (dot-all 플래그 s 추가)
    const match = llmResponse.match(/\[.*\]/s);
    if (match) {
      const parsed = JSON.parse(match[0]);
      console.log('파싱된 추천:', parsed);
      
      if (!Array.isArray(parsed)) {
        console.log('❌ Parsed response is not an array:', typeof parsed);
        return [];
      }
      
      if (parsed.length === 0) {
        console.log('❌ Parsed array is empty');
        return [];
      }
      
      // 각 추천에 기본값 추가
      const recommendations = parsed.map((rec: Recommendation, index: number) => {
        console.log(`📋 Processing recommendation ${index + 1}:`, rec);
        return {
          ...rec,
          category: rec.category || category, // Add category field
          researchBacking: rec.researchBacking || {
            summary: 'Based on current research',
            studies: []
          },
          contraindications: rec.contraindications || [],
          frequency: rec.frequency || 'Daily',
          expectedTimeline: rec.expectedTimeline || '4-6 weeks',
          priority: rec.priority || 'medium'
        };
      });
      
      console.log(`✅ Successfully parsed ${recommendations.length} recommendations for category: ${category}`);
      return recommendations;
    }
    
    console.log('❌ JSON 배열을 찾을 수 없음');
    return [];
  } catch (error) {
    console.error('❌ JSON 파싱 에러:', error);
    return [];
  }
}

function filterRecommendationsByCategory(recommendations: Recommendation[], category: string): Recommendation[] {
  console.log(`🔍 Filtering ${recommendations.length} recommendations for category: ${category}`);
  
  const categoryKeywords = {
    food: ['food', 'eat', 'consume', 'diet', 'nutrition', 'supplement', 'vitamin', 'mineral', 'meal', 'cooking', 'portion', 'flaxseed', 'salmon', 'magnesium', 'omega', 'protein', 'carbohydrate', 'fat', 'fiber', 'take', 'daily', 'weekly', 'tea', 'herb', 'spice', 'drink', 'beverage', 'infusion', 'extract', 'powder', 'capsule', 'tablet', 'oil', 'seed', 'nut', 'fruit', 'vegetable', 'grain', 'legume'],
    movement: ['exercise', 'workout', 'yoga', 'walk', 'run', 'strength', 'training', 'dance', 'sport', 'physical', 'movement', 'activity', 'session', 'minute', 'intensity', 'cardio', 'stretching', 'perform', 'practice'],
    mindfulness: ['meditation', 'breathing', 'relaxation', 'stress', 'mental', 'mindfulness', 'emotional', 'progressive', 'muscle', 'technique', 'practice', 'wellness', 'calm', 'focus', 'awareness', 'mindful']
  };

  const excludeKeywords = {
    food: ['exercise', 'workout', 'yoga', 'meditation', 'breathing', 'movement', 'physical', 'session', 'minute'],
    movement: ['food', 'eat', 'consume', 'supplement', 'vitamin', 'meditation', 'breathing', 'mental', 'stress', 'tea', 'herb', 'spice', 'drink', 'beverage', 'infusion', 'extract', 'powder', 'capsule', 'tablet', 'oil', 'seed', 'nut', 'fruit', 'vegetable', 'grain', 'legume'],
    mindfulness: ['food', 'eat', 'consume', 'supplement', 'vitamin', 'exercise', 'workout', 'yoga', 'physical', 'movement', 'tea', 'herb', 'spice', 'drink', 'beverage', 'infusion', 'extract', 'powder', 'capsule', 'tablet', 'oil', 'seed', 'nut', 'fruit', 'vegetable', 'grain', 'legume']
  };

  const filtered = recommendations.filter(rec => {
    const title = (rec.title || '').toLowerCase();
    const action = (rec.specificAction || '').toLowerCase();
    const text = `${title} ${action}`;

    console.log(`📝 Checking recommendation: "${title}" - "${action}"`);

    // Check if recommendation contains category-appropriate keywords
    const hasCategoryKeywords = categoryKeywords[category as keyof typeof categoryKeywords]?.some(keyword => 
      text.includes(keyword)
    );

    // Check if recommendation contains excluded keywords
    const hasExcludedKeywords = excludeKeywords[category as keyof typeof excludeKeywords]?.some(keyword => 
      text.includes(keyword)
    );

    // Special case: Yoga should be in movement, not mindfulness
    if (category === 'mindfulness' && text.includes('yoga')) {
      console.log(`❌ Rejected: Yoga in mindfulness category`);
      return false;
    }

    // Special case: Supplements should be in food, not other categories
    if (category !== 'food' && (text.includes('supplement') || text.includes('vitamin') || text.includes('mineral'))) {
      console.log(`❌ Rejected: Supplement in non-food category`);
      return false;
    }

    // Special case: Food items (tea, herbs, spices, drinks) should be in food, not other categories
    if (category !== 'food' && (text.includes('tea') || text.includes('herb') || text.includes('spice') || text.includes('drink') || text.includes('beverage') || text.includes('infusion'))) {
      console.log(`❌ Rejected: Food item (${text}) in non-food category (${category})`);
      return false;
    }

    // Special case: Physical activities should be in movement, not mindfulness
    if (category === 'mindfulness' && (text.includes('exercise') || text.includes('workout') || text.includes('physical') || text.includes('movement'))) {
      console.log(`❌ Rejected: Physical activity in mindfulness category`);
      return false;
    }

    const result = hasCategoryKeywords && !hasExcludedKeywords;
    console.log(`✅ ${result ? 'Accepted' : 'Rejected'}: hasCategoryKeywords=${hasCategoryKeywords}, hasExcludedKeywords=${hasExcludedKeywords}`);
    
    return result;
  });

  console.log(`🔍 Filtering complete: ${recommendations.length} → ${filtered.length} recommendations`);
  
  // If no recommendations passed strict filtering, try more lenient approach
  if (filtered.length === 0 && recommendations.length > 0) {
    console.log(`⚠️ No recommendations passed strict filtering, trying lenient approach...`);
    
    const lenientFiltered = recommendations.filter(rec => {
      const title = (rec.title || '').toLowerCase();
      const action = (rec.specificAction || '').toLowerCase();
      const text = `${title} ${action}`;
      
      // Only check for excluded keywords, accept if no major conflicts
      const hasExcludedKeywords = excludeKeywords[category as keyof typeof excludeKeywords]?.some(keyword => 
        text.includes(keyword)
      );
      
      // Special cases still apply
      if (category === 'mindfulness' && text.includes('yoga')) return false;
      if (category !== 'food' && (text.includes('supplement') || text.includes('vitamin') || text.includes('mineral'))) return false;
      if (category !== 'food' && (text.includes('tea') || text.includes('herb') || text.includes('spice') || text.includes('drink') || text.includes('beverage') || text.includes('infusion'))) return false;
      if (category === 'mindfulness' && (text.includes('exercise') || text.includes('workout') || text.includes('physical') || text.includes('movement'))) return false;
      
      return !hasExcludedKeywords;
    });
    
    console.log(`🔍 Lenient filtering: ${recommendations.length} → ${lenientFiltered.length} recommendations`);
    return lenientFiltered;
  }
  
  return filtered;
}

function postProcessRecommendations(recommendations: Recommendation[], category: string): Recommendation[] {
  console.log(`🔧 Post-processing ${recommendations.length} recommendations for category: ${category}`);
  
  // Food-related keywords that should always be in the food category
  const foodKeywords = ['tea', 'herb', 'spice', 'drink', 'beverage', 'infusion', 'extract', 'powder', 'capsule', 'tablet', 'oil', 'seed', 'nut', 'fruit', 'vegetable', 'grain', 'legume', 'supplement', 'vitamin', 'mineral', 'spearmint', 'chamomile', 'ginger', 'turmeric', 'cinnamon', 'honey', 'lemon', 'mint', 'lavender', 'rose', 'hibiscus', 'green tea', 'black tea', 'white tea', 'oolong tea', 'herbal tea'];
  
  // Movement-related keywords that should always be in the movement category
  const movementKeywords = ['yoga', 'exercise', 'workout', 'walk', 'run', 'strength', 'training', 'dance', 'sport', 'physical', 'movement', 'activity', 'session', 'minute', 'intensity', 'cardio', 'stretching', 'perform', 'practice', 'pilates', 'zumba', 'swimming', 'cycling', 'jogging', 'hiking', 'weightlifting', 'aerobics'];
  
  // Mindfulness-related keywords that should always be in the mindfulness category
  const mindfulnessKeywords = ['meditation', 'breathing', 'relaxation', 'stress', 'mental', 'mindfulness', 'emotional', 'progressive', 'muscle', 'technique', 'practice', 'wellness', 'calm', 'focus', 'awareness', 'mindful', 'visualization', 'guided', 'mantra', 'zen', 'vipassana', 'transcendental'];
  
  let removedCount = 0;
  let filtered = recommendations;
  
  // Remove food items from non-food categories
  if (category !== 'food') {
    filtered = filtered.filter(rec => {
      const title = (rec.title || '').toLowerCase();
      const action = (rec.specificAction || '').toLowerCase();
      const text = `${title} ${action}`;
      
      const hasFoodKeywords = foodKeywords.some(keyword => text.includes(keyword));
      if (hasFoodKeywords) {
        console.log(`🚫 Removed food item from ${category} category: "${title}"`);
        removedCount++;
      }
      return !hasFoodKeywords;
    });
  }
  
  // Remove movement items from non-movement categories
  if (category !== 'movement') {
    filtered = filtered.filter(rec => {
      const title = (rec.title || '').toLowerCase();
      const action = (rec.specificAction || '').toLowerCase();
      const text = `${title} ${action}`;
      
      const hasMovementKeywords = movementKeywords.some(keyword => text.includes(keyword));
      if (hasMovementKeywords) {
        console.log(`🚫 Removed movement item from ${category} category: "${title}"`);
        removedCount++;
      }
      return !hasMovementKeywords;
    });
  }
  
  // Remove mindfulness items from non-mindfulness categories
  if (category !== 'mindfulness') {
    filtered = filtered.filter(rec => {
      const title = (rec.title || '').toLowerCase();
      const action = (rec.specificAction || '').toLowerCase();
      const text = `${title} ${action}`;
      
      const hasMindfulnessKeywords = mindfulnessKeywords.some(keyword => text.includes(keyword));
      if (hasMindfulnessKeywords) {
        console.log(`🚫 Removed mindfulness item from ${category} category: "${title}"`);
        removedCount++;
      }
      return !hasMindfulnessKeywords;
    });
  }
  
  console.log(`🔧 Post-processing complete: ${recommendations.length} → ${filtered.length} recommendations (removed ${removedCount} misclassified items)`);
  return filtered;
}

function evaluateLLMConfidence(llmResponse: string): number {
  // 신뢰도 평가: 응답 품질 기반
  if (!llmResponse || llmResponse.trim() === '') {
    return 0; // 빈 응답
  }
  
  // LLM이 명시한 신뢰도 확인
  const confidenceMatch = llmResponse.match(/confidence:\s*(\d+)/i);
  if (confidenceMatch) {
    const llmConfidence = parseInt(confidenceMatch[1], 10);
    console.log('LLM 명시 신뢰도:', llmConfidence);
    return llmConfidence;
  }
  
  // JSON 파싱 가능 여부 확인
  try {
    const match = llmResponse.match(/\[.*\]/);
    if (!match) {
      return 30; // JSON 배열 없음
    }
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return 40; // 빈 배열
    }
    
    // 각 추천의 품질 확인
    let qualityScore = 0;
    parsed.forEach((rec: Recommendation) => {
      if (rec.title && rec.specificAction && rec.researchBacking) {
        qualityScore += 20; // 필수 필드 있음
      }
      if (rec.researchBacking?.studies && rec.researchBacking.studies.length > 0) {
        qualityScore += 10; // 연구 정보 있음
      }
    });
    
    return Math.min(qualityScore, 100);
  } catch {
    return 20; // JSON 파싱 실패
  }
}

function generateFallbackRecommendations(category: string, userProfile: any): Recommendation[] {
  console.log(`🔄 Generating fallback recommendations for ${category}`);
  
  const fallbacks = {
    food: [
      {
        title: 'Protein-Rich Breakfast',
        specificAction: 'Consume 25g protein with breakfast daily (2 eggs + 1 cup Greek yogurt + 1/4 cup nuts)',
        frequency: 'Daily',
        expectedTimeline: '4-6 weeks',
        priority: 'high',
        contraindications: [],
        researchBacking: {
          summary: 'Based on general nutrition research for hormone balance',
          studies: []
        }
      },
      {
        title: 'Omega-3 Supplementation',
        specificAction: 'Take 1000mg omega-3 supplement with dinner daily for hormone support',
        frequency: 'Daily',
        expectedTimeline: '8-12 weeks',
        priority: 'medium',
        contraindications: ['Not recommended during pregnancy'],
        researchBacking: {
          summary: 'Based on research showing omega-3 benefits for hormone health',
          studies: []
        }
      }
    ],
    movement: [
      {
        title: 'Power Walking Routine',
        specificAction: 'Complete 30-minute power walking at 4.2 mph pace daily',
        frequency: 'Daily',
        expectedTimeline: '4-6 weeks',
        priority: 'high',
        contraindications: [],
        researchBacking: {
          summary: 'Based on research showing benefits of regular movement for hormone balance',
          studies: []
        }
      },
      {
        title: 'Bodyweight Strength Training',
        specificAction: 'Complete 3 sets of 15 squats, 10 push-ups, and 12 lunges 4 times per week',
        frequency: '4 times per week',
        expectedTimeline: '4-6 weeks',
        priority: 'medium',
        contraindications: [],
        researchBacking: {
          summary: 'Based on research showing strength training benefits for hormone balance',
          studies: []
        }
      }
    ],
    mindfulness: [
      {
        title: '4-7-8 Breathing Technique',
        specificAction: 'Practice 4-7-8 breathing pattern for 10 minutes daily (inhale 4, hold 7, exhale 8)',
        frequency: 'Daily',
        expectedTimeline: '4-6 weeks',
        priority: 'high',
        contraindications: [],
        researchBacking: {
          summary: 'Based on research showing breathing benefits for stress reduction',
          studies: []
        }
      },
      {
        title: 'Body Scan Meditation',
        specificAction: 'Complete 15-minute guided body scan meditation focusing on progressive relaxation daily',
        frequency: 'Daily',
        expectedTimeline: '8-12 weeks',
        priority: 'medium',
        contraindications: [],
        researchBacking: {
          summary: 'Based on research showing meditation benefits for hormone balance',
          studies: []
        }
      }
    ]
  };
  
  return fallbacks[category as keyof typeof fallbacks] || [];
}

// 상세 프롬프트 생성 함수 (리팩토링 전과 동일하게)
function suggestLLMPromptForRecommendations({ userProfile, category, alternativePreferences }: { userProfile: UserProfile, category: string, alternativePreferences?: string[] }): string {
  const { primaryImbalance, secondaryImbalances, conditions, symptoms, cyclePhase, birthControlStatus, age, ethnicity } = userProfile;
  const userHealthProfile = [
    age && `Age: ${age}`,
    ethnicity && `Ethnicity: ${ethnicity}`,
    cyclePhase && cyclePhase !== 'unknown' && `Cycle phase: ${cyclePhase}`,
    birthControlStatus && `Birth control: ${birthControlStatus}`,
    conditions && conditions.length > 0 && `Diagnosis: ${conditions.join(', ')}`,
    symptoms && symptoms.length > 0 && `Symptoms: ${symptoms.join(', ')}`
  ].filter(Boolean).join(', ');
  const secondaryImbalancesText = secondaryImbalances && secondaryImbalances.length > 0 
    ? `, Secondary: ${secondaryImbalances.join(', ')}` 
    : '';
  const prompt = `
  You are a medical AI assistant specializing in women's hormone health. Your task is to generate HIGHLY SPECIFIC, SCIENTIFICALLY-BASED recommendations with exact amounts, durations, and frequencies.

  Category: ${category}
  Root cause (hormones out of balance): ${primaryImbalance}${secondaryImbalancesText}
  User health profile: ${userHealthProfile}
  ${alternativePreferences && alternativePreferences.length > 0 ? `User preferences for alternatives: ${alternativePreferences.join(', ')}` : ''}

  USER PERSONALIZATION PREFERENCES (USE THESE TO CUSTOMIZE RECOMMENDATIONS):
  ${alternativePreferences && alternativePreferences.length > 0 ? `
  - User preferences: ${alternativePreferences.join(', ')}
  - IMPORTANT: Use these preferences to customize recommendations
  - For movement: Focus on specific exercises, avoid generic terms like "gentle movement" or "stretching"
  - For food: Consider dietary restrictions and preferences
  - For mindfulness: Focus on specific techniques, avoid generic terms
  ` : 'No personalization data available'}

  STRICT CATEGORIZATION RULES - ONLY generate recommendations that fit EXACTLY in the specified category:

  FOOD CATEGORY ONLY:
  - Food items, meals, dietary patterns, nutritional supplements, vitamins, minerals
  - Herbal teas, spices, herbs, beverages, drinks, infusions, extracts
  - Cooking methods, meal timing, portion sizes, food combinations
  - NO exercise, movement, yoga, meditation, breathing exercises
  - REQUIRE specific amounts, timing, and preparation methods
  - Examples: "Consume 2 tablespoons of ground flaxseed daily with breakfast", "Eat 100g of wild-caught salmon 3 times per week for dinner", "Take 400mg magnesium glycinate supplement 30 minutes before bed", "Drink 2 cups of spearmint tea daily (morning and evening)", "Add 1 teaspoon of Ceylon cinnamon to oatmeal or smoothies daily"

  MOVEMENT CATEGORY ONLY:
  - Physical exercise, workouts, yoga, walking, running, strength training, dance, sports
  - Movement patterns, exercise routines, physical activities
  - NO food, supplements, meditation, breathing exercises
  - AVOID generic terms like "gentle movement", "stretching", "light activity", "moderate exercise"
  - REQUIRE specific exercises with exact details: sets, reps, weights, duration, intensity
  - Examples: "Complete 3 sets of 12 squats with 15-pound weights 3 times per week", "Practice 45-minute vinyasa flow yoga 4 times per week", "Do 25-minute HIIT cardio sessions with 30-second intervals 4 times per week", "Perform 4 sets of 8 deadlifts with 20-pound dumbbells 3 times per week", "Complete 30-minute power walking at 4.5 mph pace 5 times per week"

  MINDFULNESS CATEGORY ONLY:
  - Meditation, breathing exercises, relaxation techniques, stress management, mental wellness
  - Mindfulness practices, mental health exercises, emotional regulation
  - NO food, supplements, physical exercise, yoga, movement
  - AVOID generic terms like "relaxation", "stress management", "mental wellness"
  - REQUIRE specific techniques with exact timing and methods
  - Examples: "Practice 15-minute Vipassana meditation daily before breakfast", "Perform 20-minute 4-7-8 breathing exercises twice daily (morning and evening)", "Do 10 minutes of progressive muscle relaxation with guided audio before bed", "Practice 12-minute body scan meditation 3 times per week", "Complete 8-minute box breathing exercise 4 times daily during work breaks"

  SCIENTIFIC REQUIREMENTS:
  - Use ONLY research studies from the last 10 years on women's hormonal health
  - Medical accuracy is CRITICAL - every recommendation must be based on actual clinical studies
  - Match research to user's specific health profile (hormones, conditions, symptoms)
  - Medical factors (symptoms, diagnosis) carry more weight than demographic factors
  - STRONGLY prefer human clinical trials over animal studies
  - ALL recommendations must be actionable with specific amounts, durations, and frequencies

  CRITICAL REQUIREMENTS FOR SPECIFIC ACTIONS:
  - FOOD: Specify exact amounts (grams, cups, servings) and frequency. Example: "Consume 2 tablespoons of ground flaxseed daily for 12 weeks" or "Eat 100g of salmon 3 times per week for 8 weeks"
  - MOVEMENT: Specify exact duration, intensity, and frequency. Example: "Complete 3 sets of 12 squats with 15-pound weights 3 times per week for 12 weeks" or "Practice 45-minute vinyasa flow yoga 4 times per week for 8 weeks"
  - MINDFULNESS: Specify exact duration, technique, and frequency. Example: "Practice 15-minute Vipassana meditation daily for 12 weeks" or "Perform 20-minute 4-7-8 breathing exercises twice daily for 8 weeks"
  - ALL recommendations must include: exact duration (weeks/months), frequency (daily/weekly), and specific amounts/times
  - Base ALL recommendations on actual research studies from the last 10 years
  - CRITICAL: If user provided preferences, incorporate them into recommendations (e.g., if user prefers yoga, focus on specific yoga poses and sequences)

  RESEARCH BACKING FORMAT:
  - Summary: "Based on [YEAR] study with [NUMBER] women showing [SPECIFIC RESULTS]"
  - Example: "Based on 2023 study with 130 women showing Improved insulin sensitivity by 25% and reduced fasting glucose"
  - Studies must include: title, authors (array), journal, publicationYear, participantCount, results
  - Example study: {"title": "Cinnamon Supplementation Improves Insulin Sensitivity in Women with PCOS", "authors": ["Lee J", "Kim S", "Park M"], "journal": "Diabetes Research", "publicationYear": 2023, "participantCount": 130, "results": "Improved insulin sensitivity by 25% and reduced fasting glucose"}

  Output format: Return a JSON array of recommendation cards. Each card must include: title, specificAction (with exact amounts/duration), frequency, intensity, expectedTimeline, priority (high/medium/low), contraindications (array), and researchBacking object with: summary (string) and studies (array of objects with: title, authors (array), journal, publicationYear, participantCount, results). Generate as many relevant cards as possible.

  Example structure: [{"title": "Cinnamon Supplementation for Insulin Sensitivity", "specificAction": "Take 1.5g of cinnamon powder daily for 12 weeks", "frequency": "Daily", "intensity": "Moderate", "expectedTimeline": "12 weeks", "priority": "high", "contraindications": ["Not recommended during pregnancy"], "researchBacking": {"summary": "Based on 2023 study with 130 women showing Improved insulin sensitivity by 25% and reduced fasting glucose", "studies": [{"title": "Cinnamon Supplementation Improves Insulin Sensitivity in Women with PCOS", "authors": ["Lee J", "Kim S", "Park M"], "journal": "Diabetes Research", "publicationYear": 2023, "participantCount": 130, "results": "Improved insulin sensitivity by 25% and reduced fasting glucose"}]}}]

  CONFIDENCE ASSESSMENT:
  - If you are highly confident in your recommendations (based on strong research evidence), include "confidence: 90" in your response
  - If you are moderately confident (some research support but limited), include "confidence: 70" in your response  
  - If you are less confident (limited research or extrapolation), include "confidence: 50" in your response
  - If you cannot provide evidence-based recommendations, include "confidence: 30" and explain why
  - Always base confidence on the quality and relevance of available research for this specific user profile
  `;
  return prompt;
}

export async function POST(request: NextRequest) {
  const { userProfile, category, alternativePreferences } = await request.json();
  
  if (!userProfile || !category) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  // 상세 프롬프트 사용
  const prompt = suggestLLMPromptForRecommendations({ userProfile, category, alternativePreferences });

  // 2. OpenAI 호출
  let llmResponse = await callOpenAI(prompt);
  let confidence = evaluateLLMConfidence(llmResponse);
  let recommendations = parseRecommendationsFromLLM(llmResponse, category);

  // 3. Fallback 로직: 신뢰도가 낮거나 추천이 없으면 Groq 사용
  console.log('OpenAI 신뢰도:', confidence, '추천 개수:', recommendations.length);
  
  if (confidence < 60 || recommendations.length === 0) {
    console.log('Fallback 실행: Groq 호출');
    const groqResponse = await callGroq(prompt);
    const groqConfidence = evaluateLLMConfidence(groqResponse);
    const groqRecommendations = parseRecommendationsFromLLM(groqResponse, category);
    
    console.log('Groq 신뢰도:', groqConfidence, '추천 개수:', groqRecommendations.length);
    
    // Groq 결과가 더 나으면 사용
    if (groqRecommendations.length > 0 && groqConfidence > confidence) {
      llmResponse = groqResponse;
      confidence = groqConfidence;
      recommendations = groqRecommendations;
      console.log('Groq 결과로 교체됨');
    } else {
      console.log('OpenAI 결과 유지');
    }
  }

  // 4. Filter recommendations by category to ensure proper categorization
  const filteredRecommendations = filterRecommendationsByCategory(recommendations, category);
  console.log(`Category: ${category}, Original: ${recommendations.length}, Filtered: ${filteredRecommendations.length}`);

  // 5. Post-processing: Ensure food items are in the correct category
  const finalRecommendations = postProcessRecommendations(filteredRecommendations, category);
  console.log(`Category: ${category}, Final: ${finalRecommendations.length} recommendations`);

  // 6. Fallback: If no recommendations after filtering, generate basic ones
  if (finalRecommendations.length === 0) {
    console.log('⚠️ No recommendations after filtering, generating fallback recommendations...');
    const fallbackRecommendations = generateFallbackRecommendations(category, userProfile);
    console.log(`🔄 Generated ${fallbackRecommendations.length} fallback recommendations for ${category}`);
    
    return NextResponse.json({
      success: true,
      recommendations: fallbackRecommendations,
      confidence: 50,
      rawLLMResponse: llmResponse,
      note: 'Fallback recommendations generated due to filtering'
    });
  }

  return NextResponse.json({
    success: true,
    recommendations: finalRecommendations,
    confidence,
    rawLLMResponse: llmResponse
  });
} 