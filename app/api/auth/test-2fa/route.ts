// /api/auth/test-2fa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';

export async function GET(req: NextRequest) {
  const secret = 'BQHESIQYBY3R4I2Y'; // Votre secret
  const currentToken = authenticator.generate(secret);
  
  return NextResponse.json({
    currentToken,
    timeRemaining: 30 - Math.floor(Date.now() / 1000 % 30)
  });
}
