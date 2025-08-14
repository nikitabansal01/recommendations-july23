import { NextRequest, NextResponse } from 'next/server';
import { getGlobalStorage, EmailData } from '../../lib/local-storage';

// Use global storage instance
const storage = getGlobalStorage();

export async function POST(request: NextRequest) {
  try {
    const { email, responseId, timestamp } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    // Generate a unique ID for this email entry
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save the email data
    const emailData: EmailData = {
      id: emailId,
      email,
      responseId: responseId || null,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Console logging for local development
    console.log('=== LOCAL DEVELOPMENT: SAVING EMAIL ===');
    console.log('Email ID:', emailId);
    console.log('Email:', email);
    console.log('Response ID:', responseId);
    console.log('Timestamp:', emailData.timestamp);
    console.log('=======================================');

    // Store in local storage
    storage.saveEmail(emailData);
    
    console.log(`Email saved locally. Total emails: ${storage.getEmailCount()}`);

    return NextResponse.json({ 
      success: true, 
      emailId,
      message: 'Email saved successfully (local development mode)' 
    });

  } catch (error) {
    console.error('Error saving email:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to save email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 