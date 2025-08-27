// app/api/v1/boards/customers/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const customers = [
    { id: "1", name: "John Doe", email: "john@example.com", last_activity_at: "2025-08-26T12:00:00Z" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", last_activity_at: "2025-08-25T10:00:00Z" },
  ];
  return NextResponse.json({ customers });
}