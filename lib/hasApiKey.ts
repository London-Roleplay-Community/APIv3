import { NextRequest } from "next/server";

export function hasApiKey(request: NextRequest): boolean {
  const header = request.headers.get("x-api-key")
  if (!header || !process.env.API_KEY) return false;
  return header === process.env.API_KEY
}