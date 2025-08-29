// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod'; // Ensure zod is imported

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  const data = loginSchema.parse(await request.json());
  const { username, password } = data;
  // Add authentication logic
  return NextResponse.json({ message: 'Login attempted' });
}