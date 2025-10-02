/**
 * Debug API: Check Environment Variables
 * GET /api/debug/check-env
 * Purpose: Verify environment variables are loaded (for debugging only)
 * IMPORTANT: Remove this endpoint in production!
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    brevoConfigured: {
      hasApiKey: !!process.env.BREVO_API_KEY,
      apiKeyLength: process.env.BREVO_API_KEY?.length || 0,
      apiKeyPrefix: process.env.BREVO_API_KEY?.substring(0, 10) || 'NOT_SET',
      hasSenderEmail: !!process.env.BREVO_SENDER_EMAIL,
      senderEmail: process.env.BREVO_SENDER_EMAIL || 'NOT_SET',
      hasSenderName: !!process.env.BREVO_SENDER_NAME,
      senderName: process.env.BREVO_SENDER_NAME || 'NOT_SET',
      platformUrl: process.env.NEXT_PUBLIC_PLATFORM_URL || 'NOT_SET'
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
