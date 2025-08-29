// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware'; // Changed from { createMiddleware }

const locales = ['en', 'es', 'fr'];
const defaultLocale = 'en';

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true, // Enable Accept-Language header detection
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'], // Match all routes except API and static files
};