import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`📱 Sending SMS to: ${to}`)
    console.log(`📱 Message: ${message}`)

    // Use your actual Twilio credentials
    const TWILIO_ACCOUNT_SID = "ACdfe59673055ab0cce4362789af5055dc"
    const TWILIO_AUTH_TOKEN = "55c3de3f1cea7195f8bc1136692de672"
    const TWILIO_PHONE_NUMBER = "+18573714241"

    try {
      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: to,
          Body: message,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ SMS sent successfully via Twilio to: ${to}`)
        console.log(`SMS SID: ${result.sid}`)
        return NextResponse.json({
          success: true,
          message: "SMS sent successfully",
          sid: result.sid,
          provider: "Twilio",
        })
      } else {
        const errorData = await response.json()
        console.error(`❌ Twilio error:`, errorData)

        return NextResponse.json(
          {
            success: false,
            error: `Twilio API error: ${response.status}`,
            details: errorData,
          },
          { status: response.status },
        )
      }
    } catch (error: any) {
      console.error(`❌ Twilio request error:`, error)
      return NextResponse.json(
        {
          success: false,
          error: `Network error: ${error.message}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("SMS sending error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process SMS request",
      },
      { status: 500 },
    )
  }
}
