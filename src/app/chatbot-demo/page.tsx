"use client";
import React from 'react';
import { ChatbotProvider } from '../lib/chatbot-context';
import Chatbot from '../components/Chatbot';
import TaskTracker from '../components/TaskTracker';
import { UserProfile, Recommendation } from '../types/ResearchData';

// Sample data for demo
const sampleUserProfile: UserProfile = {
  hormoneScores: {
    androgens: 7,
    progesterone: 4,
    estrogen: 6,
    thyroid: 5,
    cortisol: 8,
    insulin: 6
  },
  primaryImbalance: 'PCOS',
  secondaryImbalances: ['Insulin Resistance'],
  conditions: ['PCOS'],
  symptoms: ['Irregular periods', 'Weight gain', 'Acne'],
  cyclePhase: 'luteal',
  birthControlStatus: 'No',
  age: 28,
  ethnicity: 'Asian',
  cravings: ['sugar', 'chocolate'],
  confidence: 'high'
};

const sampleRecommendations: Recommendation[] = [
  {
    id: 'food-1',
    category: 'food',
    title: 'Anti-inflammatory Breakfast Bowl',
    specificAction: 'Start your day with a bowl of Greek yogurt, berries, and nuts to reduce inflammation and balance blood sugar.',
    researchBacking: {
      studies: [],
      summary: 'Research shows that anti-inflammatory foods can help reduce PCOS symptoms and improve insulin sensitivity.'
    },
    expectedTimeline: '2-4 weeks',
    contraindications: [],
    frequency: 'Daily',
    duration: '15 minutes',
    intensity: 'low',
    priority: 'high',
    relevanceScore: 95
  },
  {
    id: 'movement-1',
    category: 'movement',
    title: 'Gentle Morning Yoga',
    specificAction: 'Practice 15 minutes of gentle yoga focusing on hip-opening poses and breathing exercises.',
    researchBacking: {
      studies: [],
      summary: 'Yoga has been shown to reduce cortisol levels and improve hormonal balance in women with PCOS.'
    },
    expectedTimeline: '3-6 weeks',
    contraindications: [],
    frequency: 'Daily',
    duration: '15 minutes',
    intensity: 'low',
    priority: 'medium',
    relevanceScore: 88
  },
  {
    id: 'mindfulness-1',
    category: 'mindfulness',
    title: 'Stress Management Breathing',
    specificAction: 'Practice deep breathing exercises for 5-10 minutes when feeling stressed or overwhelmed.',
    researchBacking: {
      studies: [],
      summary: 'Deep breathing activates the parasympathetic nervous system, helping to reduce cortisol and stress hormones.'
    },
    expectedTimeline: '1-2 weeks',
    contraindications: [],
    frequency: '3x daily',
    duration: '5-10 minutes',
    intensity: 'low',
    priority: 'high',
    relevanceScore: 92
  }
];

export default function ChatbotDemoPage() {
  return (
    <ChatbotProvider userProfile={sampleUserProfile}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              🤖 Chatbot Demo - Auvra Assistant
            </h1>
            <p className="text-gray-600 mb-6">
              This is a demonstration of the Auvra chatbot system. The chatbot will automatically appear after 15 seconds 
              to ask for feedback on your action plan. You can also interact with the task tracker below.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Demo Features:</h3>
              <ul className="text-blue-700 space-y-1">
                <li>• <strong>Feedback Flow:</strong> Automatically triggers after 15 seconds</li>
                <li>• <strong>Task Modification:</strong> Choose to skip, change, or delay tasks</li>
                <li>• <strong>Action Changes:</strong> Switch to easier or different activities</li>
                <li>• <strong>Personalization:</strong> Answer questions to customize your plan</li>
                <li>• <strong>Celebration:</strong> Get congratulated when completing all tasks</li>
              </ul>
            </div>
          </div>

          {/* Task Tracker Demo */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📋 Task Tracker Demo
            </h2>
            <p className="text-gray-600 mb-6">
              Check off tasks as you complete them. When you complete all tasks in order, the celebration chatbot will appear!
            </p>
            
            <TaskTracker 
              recommendations={sampleRecommendations} 
              category="food"
            />
          </div>

          {/* Sample Recommendations */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              🎯 Sample Recommendations
            </h2>
            <div className="space-y-6">
              {sampleRecommendations.map((rec) => (
                <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {rec.title}
                  </h3>
                  <p className="text-gray-600 mb-2">{rec.specificAction}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Priority: <span className="font-medium">{rec.priority}</span></span>
                    <span>Frequency: <span className="font-medium">{rec.frequency}</span></span>
                    <span>Duration: <span className="font-medium">{rec.duration}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </ChatbotProvider>
  );
} 