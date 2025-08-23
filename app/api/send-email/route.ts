import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json()

    if (!to || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`📧 Sending email to: ${to}`)
    console.log(`📧 Subject: ${subject}`)

    // Use your actual SendGrid API key
    const SENDGRID_API_KEY = "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"

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject,
            },
          ],
          from: {
            email: "noreply@siteguardpro.com",
            name: "SiteGuard Pro",
          },
          content: [
            {
              type: "text/html",
              value: html || text || "Default message",
            },
          ],
        }),
      })

      if (response.ok) {
        console.log(`✅ Email sent successfully via SendGrid to: ${to}`)
        return NextResponse.json({
          success: true,
          message: "Email sent successfully",
          provider: "SendGrid",
        })
      } else {
        const errorData = await response.json()
        console.error(`❌ SendGrid error:`, errorData)

        // Log detailed error for debugging
        console.error(`SendGrid Response Status: ${response.status}`)
        console.error(`SendGrid Response Headers:`, Object.fromEntries(response.headers.entries()))

        return NextResponse.json(
          {
            success: false,
            error: `SendGrid API error: ${response.status}`,
            details: errorData,
          },
          { status: response.status },
        )
      }
    } catch (error: any) {
      console.error(`❌ SendGrid request error:`, error)
      return NextResponse.json(
        {
          success: false,
          error: `Network error: ${error.message}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process email request",
      },
      { status: 500 },
    )
  }
}
