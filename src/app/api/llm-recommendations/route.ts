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
        model: 'gpt-4o',
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
  researchBacking?: {
    summary: string;
    studies: unknown[];
  };
  contraindications?: unknown[];
  frequency?: string;
  expectedTimeline?: string;
  priority?: string;
}

function parseRecommendationsFromLLM(llmResponse: string): Recommendation[] {
  // LLM이 반환한 JSON 배열을 파싱
  try {
    console.log('LLM 원본 응답:', llmResponse);
    
    // JSON 배열 찾기 (dot-all 플래그 s 추가)
    const match = llmResponse.match(/\[.*\]/s);
    if (match) {
      const parsed = JSON.parse(match[0]);
      console.log('파싱된 추천:', parsed);
      
      // 각 추천에 기본값 추가
      return parsed.map((rec: Recommendation) => ({
        ...rec,
        researchBacking: rec.researchBacking || {
          summary: 'Based on current research',
          studies: []
        },
        contraindications: rec.contraindications || [],
        frequency: rec.frequency || 'Daily',
        expectedTimeline: rec.expectedTimeline || '4-6 weeks',
        priority: rec.priority || 'medium'
      }));
    }
    
    console.log('JSON 배열을 찾을 수 없음');
    return [];
  } catch (error) {
    console.error('JSON 파싱 에러:', error);
    return [];
  }
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

// 상세 프롬프트 생성 함수 (리팩토링 전과 동일하게)
function suggestLLMPromptForRecommendations({ userProfile, category }: { userProfile: UserProfile, category: string }): string {
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

  SCIENTIFIC REQUIREMENTS:
  - Use ONLY research studies from the last 10 years on women's hormonal health
  - Medical accuracy is CRITICAL - every recommendation must be based on actual clinical studies
  - Match research to user's specific health profile (hormones, conditions, symptoms)
  - Medical factors (symptoms, diagnosis) carry more weight than demographic factors
  - STRONGLY prefer human clinical trials over animal studies
  - If research mentions specific supplements/nutrients, you may reference additional studies for food sources and amounts
  - ALL recommendations must be actionable with specific amounts, durations, and frequencies

  CRITICAL REQUIREMENTS FOR SPECIFIC ACTIONS:
  - FOOD: Specify exact amounts (grams, cups, servings) and frequency. Example: "Consume 2 tablespoons of ground flaxseed daily for 12 weeks" or "Eat 100g of salmon 3 times per week for 8 weeks"
  - MOVEMENT: Specify exact duration, intensity, and frequency. Example: "Perform 30-minute moderate-intensity yoga sessions 4 times per week for 12 weeks" or "Walk briskly for 45 minutes daily for 8 weeks"
  - MINDFULNESS: Specify exact duration, technique, and frequency. Example: "Practice 15-minute daily meditation for 12 weeks" or "Perform 20-minute deep breathing exercises twice daily for 8 weeks"
  - ALL recommendations must include: exact duration (weeks/months), frequency (daily/weekly), and specific amounts/times
  - Base ALL recommendations on actual research studies from the last 10 years
  - If research mentions specific supplements/nutrients, you may reference additional studies for food sources and amounts

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
  const { userProfile, category } = await request.json();
  
  if (!userProfile || !category) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  // 상세 프롬프트 사용
  const prompt = suggestLLMPromptForRecommendations({ userProfile, category });

  // 2. OpenAI 호출
  let llmResponse = await callOpenAI(prompt);
  let confidence = evaluateLLMConfidence(llmResponse);
  let recommendations = parseRecommendationsFromLLM(llmResponse);

  // 3. Fallback 로직: 신뢰도가 낮거나 추천이 없으면 Groq 사용
  console.log('OpenAI 신뢰도:', confidence, '추천 개수:', recommendations.length);
  
  if (confidence < 60 || recommendations.length === 0) {
    console.log('Fallback 실행: Groq 호출');
    const groqResponse = await callGroq(prompt);
    const groqConfidence = evaluateLLMConfidence(groqResponse);
    const groqRecommendations = parseRecommendationsFromLLM(groqResponse);
    
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

  return NextResponse.json({
    success: true,
    recommendations,
    confidence,
    rawLLMResponse: llmResponse
  });
} 