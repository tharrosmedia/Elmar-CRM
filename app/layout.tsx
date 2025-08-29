// app/layout.tsx
import './globals.css'; // Adjusted to relative path within app/
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Elmar HVAC CRM' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}