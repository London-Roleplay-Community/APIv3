import { NextRequest, NextResponse } from "next/server.js";

export async function GET(request: NextRequest) {
  const server = {
    region: request.headers.get('x-vercel-id')?.split("::")[0] || "unknown",
    environment: process.env.VERCEL_ENV || "dev",
  }
  return NextResponse.json({
    status: 200,
    message: "OK",
    time: new Date().toISOString(),
    server: {
      region: server.region,
      environment: server.environment
    },
  })
}