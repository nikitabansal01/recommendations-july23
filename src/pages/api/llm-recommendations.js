import { suggestLLMPromptForRecommendations } from '../../logic/recommendations/engine';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function callOpenAI(prompt) {
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

async function callGroq(prompt) {
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

function parseRecommendationsFromLLM(llmResponse) {
  // LLM이 반환한 JSON 배열을 파싱
  try {
    console.log('LLM 원본 응답:', llmResponse);
    
    // JSON 배열 찾기
    const match = llmResponse.match(/\[.*\]/s);
    if (match) {
      const parsed = JSON.parse(match[0]);
      console.log('파싱된 추천:', parsed);
      
      // 각 추천에 기본값 추가
      return parsed.map(rec => ({
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
  } catch (_) {
    console.error('JSON 파싱 에러:', _);
    return [];
  }
}

function evaluateLLMConfidence(llmResponse) {
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
    const match = llmResponse.match(/\[.*\]/s);
    if (!match) {
      return 30; // JSON 배열 없음
    }
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return 40; // 빈 배열
    }
    
    // 각 추천의 품질 확인
    let qualityScore = 0;
    parsed.forEach(rec => {
      if (rec.title && rec.specificAction && rec.researchBacking) {
        qualityScore += 20; // 필수 필드 있음
      }
      if (rec.researchBacking?.studies?.length > 0) {
        qualityScore += 10; // 연구 정보 있음
      }
    });
    
    return Math.min(qualityScore, 100);
  } catch (_) {
    return 20; // JSON 파싱 실패
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userProfile, constraints, category } = req.body;
  if (!userProfile || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // 1. 프롬프트 생성
  const prompt = suggestLLMPromptForRecommendations({ userProfile, constraints, category });

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

  res.status(200).json({
    success: true,
    recommendations,
    confidence,
    rawLLMResponse: llmResponse
  });
} 