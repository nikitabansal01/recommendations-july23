import { NextRequest, NextResponse } from 'next/server';
import { getGlobalStorage, ResponseData } from '../../lib/local-storage';

// Use global storage instance
const storage = getGlobalStorage();

export async function POST(request: NextRequest) {
  try {
    const { surveyData, results, email, timestamp } = await request.json();

    if (!surveyData || !results) {
      return NextResponse.json({ message: 'Missing required data' }, { status: 400 });
    }

    // Generate a unique ID for this response
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save the response data
    const responseData: ResponseData = {
      id: responseId,
      surveyData,
      results,
      email: email || null,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Console logging for local development
    console.log('=== LOCAL DEVELOPMENT: SAVING RESPONSE ===');
    console.log('Response ID:', responseId);
    console.log('Survey Data:', JSON.stringify(surveyData, null, 2));
    console.log('Results:', JSON.stringify(results, null, 2));
    console.log('Email:', email);
    console.log('Timestamp:', responseData.timestamp);
    console.log('==========================================');
    
    // Store in local storage
    storage.saveResponse(responseData);
    
    console.log(`Response saved locally. Total responses: ${storage.getResponseCount()}`);

    return NextResponse.json({ 
      success: true, 
      responseId,
      message: 'Response saved successfully (local development mode)' 
    });

  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to save response',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 