import { NextRequest, NextResponse } from 'next/server';
import { getGlobalStorage, ResponseData } from '../../lib/local-storage';

// Use global storage instance
const storage = getGlobalStorage();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get('responseId');
    
    if (responseId) {
      // 단일 응답 조회
      const responseData = storage.getResponse(responseId);
      if (responseData) {
        console.log('=== LOCAL DEVELOPMENT: LOADING SINGLE RESPONSE ===');
        console.log('Response ID:', responseId);
        console.log('Response Data:', JSON.stringify(responseData, null, 2));
        console.log('==================================================');
        return NextResponse.json({ success: true, response: responseData });
      } else {
        return NextResponse.json({ success: false, message: 'Response not found' }, { status: 404 });
      }
    }

    console.log('=== LOCAL DEVELOPMENT: FETCHING ALL RESPONSES ===');
    console.log(`Found ${storage.getResponseCount()} responses`);
    
    // Fetch all response data from local storage
    const responses = storage.getAllResponses();

    console.log(`Successfully fetched ${responses.length} responses`);
    console.log('==================================================');

    return NextResponse.json({ 
      success: true, 
      responses,
      count: responses.length,
      message: 'Responses fetched successfully (local development mode)' 
    });

  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch responses',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 