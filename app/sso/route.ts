import { NextRequest, NextResponse } from "next/server.js";
import clientPromise from "../../lib/mongodb.js";
import axios from "axios";

const cid = process.env.CLIENT_ID
const secret = process.env.CLIENT_SECRET
const discordSecret = process.env.DISCORD_TOKEN
const discordClientId = process.env.DISCORD_CLIENTID
const callback = "https://api.jxson.tech/api/sso"

export async function GET(req: NextRequest) {
  NextResponse.json({
    "message": "503 Service Unavailable"
  }, { headers: { "Retry-After": "1440" }, status: 503 })
  const client = await clientPromise
  const users = client.db("roblox").collection("users")
  const pending = client.db("roblox").collection("sso_pending")
  const {code, state} = Object.fromEntries(req.nextUrl.searchParams)

  try {
    if (!code && !state) {
      const state = crypto.randomUUID()
      await pending.insertOne({ state, roblox: { done: false }, discord: { done: false }, createdAt: new Date() })

      const robloxUri = `https://apis.roblox.com/oauth/v1/authorize?client_id=${cid}&redirect_uri=${encodeURIComponent(callback)}&response_type=code&scope=openid%20profile+&state=${state}`
      return NextResponse.redirect(robloxUri)
    }
    if (!state) return NextResponse.json({ message: "Invalid state" }, { status: 400 })
    const session = await pending.findOne({ state: String(state) })
    if (!session) return NextResponse.json({ message: "Invalid state" }, { status: 400 })
    if (!session.roblox.done) {
      const tokenRes = await axios.post("https://apis.roblox.com/oauth/v1/token", new URLSearchParams({ grant_type: "authorization_code", code: String(code), client_id: String(cid), client_secret: String(secret), redirect_uri: callback }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } })
      const token = tokenRes.data.access_token
      const userRes = await axios.get("https://apis.roblox.com/oauth/v1/userinfo", { headers: { Authorization: `Bearer ${token}` } })
      const user = userRes.data

      await pending.updateOne({ state: String(state) }, { $set: { roblox: { done: true, userId: user.sub, username: user.preferred_username } } })
      const discordUri = `https://discord.com/oauth2/authorize?client_id=1404237234152149092&response_type=code&redirect_uri=${encodeURIComponent(callback)}&scope=identify&state=${state}`
      return NextResponse.redirect(discordUri)
    }

    if (!session.discord.done) {
      const tokenRes = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({ client_id: String(discordClientId), client_secret: String(discordSecret), grant_type: "authorization_code", code: String(code), redirect_uri: callback }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } })
      const token = tokenRes.data.access_token
      const userRes = await axios.get("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${token}` } })
      const user = userRes.data
      await pending.updateOne({ state: String(state) }, { $set: { discord: { done: true, id: user.id, username: user.global_name || user.username } } })
      await users.updateOne({ discordId: user.id }, { $set: { discord: { id: user.id, user: user.username }, roblox: { id: session.roblox.username, user: session.roblox.username }, verified: true, verifiedAt: new Date() } }, { upsert: true })
      await pending.deleteOne({ state: String(state) })

      return new NextResponse(`<html>
      <body style="font-family:sans-serif;text-align:center;padding-top:40px>
      <h1>Successfully verified</h1>
      <p>Discord linked with: ${session.roblox.username}</p>
      </body>
      </html>`, { status: 200, headers: { "Content-Type": "text/html" } })
    }

    return NextResponse.json({ message: "400 Bad Request" }, { status: 400 })
  } catch (error:any) {
    console.error(error.response?.data || error)
    return NextResponse.json({ message: "500 (Internal Server Error)" }, { status: 500 })
  }
}