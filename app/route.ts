import { NextResponse } from "next/server.js";

export async function GET() {
  return NextResponse.json({
    status: 200,
    message: "OK"
  })
}