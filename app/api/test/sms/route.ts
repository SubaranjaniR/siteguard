import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.",
        },
        { status: 500 },
      )
    }

    console.log(`📱 Testing SMS to: ${phone}`)

    try {
      const twilio = require("twilio")
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

      const result = await client.messages.create({
        body: message || "🧪 SiteGuard Pro test SMS: Your notifications are working! ✅",
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      })

      console.log(`✅ Test SMS sent successfully to: ${phone}`)
      console.log(`SMS SID: ${result.sid}`)

      return NextResponse.json({
        success: true,
        message: "Test SMS sent successfully",
        sid: result.sid,
      })
    } catch (error: any) {
      console.error(`❌ Twilio error:`, error)

      let errorMessage = "Failed to send SMS"
      if (error.message) {
        errorMessage = error.message
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Test SMS error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
      },
      { status: 400 },
    )
  }
}
