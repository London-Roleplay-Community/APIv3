import { NextRequest, NextResponse } from "next/server.js";
import clientPromise from "../../../lib/mongodb.js";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const collection = client.db("roblox").collection("groups")
    const data = await collection.findOne({})
    if (data) {
      delete (data as any)._id;
    } else {
      return NextResponse.json({ message: "Could not fetch" }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}