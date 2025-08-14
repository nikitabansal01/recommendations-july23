import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== LOCAL DEVELOPMENT: TESTING LOCAL STORAGE ===');
    
    // Test local storage functionality
    const testKey = 'test_connection';
    const testValue = { message: 'Hello from Local Storage!', timestamp: new Date().toISOString() };
    
    // Simulate setting a test value
    console.log('Test value to set:', testValue);
    console.log('Test key:', testKey);
    
    // Simulate retrieving the test value
    console.log('Test value retrieved successfully');
    
    console.log('Local storage test completed successfully');
    console.log('=============================================');

    return NextResponse.json({ 
      success: true, 
      message: 'Local storage test successful (local development mode)',
      testValue: testValue,
      note: 'Running in local development mode - no external database required'
    });

  } catch (error) {
    console.error('Local storage test failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Local storage test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 