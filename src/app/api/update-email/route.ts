import { NextRequest, NextResponse } from 'next/server';
import { getGlobalStorage } from '../../lib/local-storage';

// Use global storage instance
const storage = getGlobalStorage();

export async function PATCH(request: NextRequest) {
  try {
    const { responseId, email } = await request.json();
    
    if (!responseId || !email) {
      return NextResponse.json({ message: 'Missing responseId or email' }, { status: 400 });
    }
    
    console.log('=== LOCAL DEVELOPMENT: UPDATING EMAIL ===');
    console.log('Response ID:', responseId);
    console.log('New Email:', email);
    console.log('========================================');
    
    // Update the email in local storage
    const success = storage.updateResponseEmail(responseId, email);
    
    if (success) {
      console.log('Email updated successfully in local storage');
      return NextResponse.json({ 
        success: true, 
        message: 'Email updated successfully (local development mode)' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Response not found' 
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json({ 
      message: 'Failed to update email', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 