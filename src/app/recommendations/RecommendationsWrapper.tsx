"use client";
import React from 'react';
import { ChatbotProvider, useChatbot } from '../lib/chatbot-context';
import { CurrentRecommendationsProvider } from '../lib/current-recommendations-context';
import RecommendationsClient from './components/RecommendationsClient';
import Chatbot from '../components/Chatbot';
import FloatingChatbotButton from '../components/FloatingChatbotButton';

interface RecommendationsWrapperProps {
  initialData: {
    surveyData: any;
    results: any;
  };
  initialRecommendations: any;
}

function RecommendationsWithChatbot({ initialData, initialRecommendations }: RecommendationsWrapperProps) {
  const { state: chatbotState, dispatch: chatbotDispatch } = useChatbot();
  
  return (
    <RecommendationsClient 
      initialData={initialData}
      initialRecommendations={initialRecommendations}
      chatbotState={chatbotState}
      chatbotDispatch={chatbotDispatch}
    />
  );
}

export default function RecommendationsWrapper({ initialData, initialRecommendations }: RecommendationsWrapperProps) {
  return (
    <CurrentRecommendationsProvider initialRecommendations={initialRecommendations}>
      <ChatbotProvider userProfile={{
        hormoneScores: initialData.results.analysis?.scores || {
          androgens: 0, progesterone: 0, estrogen: 0, thyroid: 0, cortisol: 0, insulin: 0
        },
        primaryImbalance: initialData.results.analysis?.primaryImbalance || '',
        secondaryImbalances: initialData.results.analysis?.secondaryImbalances || [],
        conditions: initialData.surveyData.q10_conditions || [],
        symptoms: initialData.surveyData.q4_symptoms || [],
        cyclePhase: initialData.results.cyclePhase || 'unknown',
        birthControlStatus: initialData.surveyData.q9_birth_control || 'No',
        age: initialData.surveyData.age,
        ethnicity: initialData.surveyData.ethnicity,
        cravings: initialData.surveyData.q7_cravings || [],
        confidence: initialData.results.confidenceLevel || 'low'
      }}>
        <RecommendationsWithChatbot 
          initialData={initialData}
          initialRecommendations={initialRecommendations}
        />
        <Chatbot />
        <FloatingChatbotButton />
      </ChatbotProvider>
    </CurrentRecommendationsProvider>
  );
} 