import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text, from, fromName } = await request.json()

    if (!to || !subject) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({ success: false, error: "SENDGRID_API_KEY not configured" }, { status: 500 })
    }

    const sgMail = require("@sendgrid/mail")
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    // Always use a verified sender for From. If client specified a different "from",
    // set it as Reply-To to preserve deliverability.
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "test@siteguard.com"
    const fromDisplay = process.env.SENDGRID_FROM_NAME || "SiteGuard Pro"

    const msg: any = {
      to,
      from: { email: fromEmail, name: fromDisplay },
      subject,
      html: html || (text ? `<pre>${text}</pre>` : "Message"),
      // Optional nice-to-haves
      trackingSettings: { clickTracking: { enable: true, enableText: true } },
      mailSettings: { sandboxMode: { enable: false } },
      categories: ["siteguard", "notification"],
    }
    if (from) {
      msg.replyTo = { email: from, name: fromName || from }
    }

    try {
      const [resp] = await sgMail.send(msg)
      console.log(`✅ Email sent via SendGrid to ${to} (status ${resp?.statusCode})`)
      return NextResponse.json({ success: true, message: "Email sent", statusCode: resp?.statusCode })
    } catch (err: any) {
      console.error("❌ SendGrid send error:", err?.response?.body || err)
      const detail = err?.response?.body || { message: err?.message || "Send failed" }
      return NextResponse.json({ success: false, error: "SendGrid send failed", details: detail }, { status: 502 })
    }
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json({ success: false, error: "Failed to process email request" }, { status: 500 })
  }
}
