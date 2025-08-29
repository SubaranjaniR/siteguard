import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, subject, message } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: "SendGrid not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.",
        },
        { status: 500 },
      )
    }

    console.log(`📧 Testing email to: ${email}`)

    try {
      const sgMail = require("@sendgrid/mail")
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)

      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: subject || "SiteGuard Pro - Test Email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🧪 Test Email</h1>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
              <h2 style="color: #333;">Email Test Successful! ✅</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                ${message || "This is a test email from SiteGuard Pro monitoring system."}
              </p>
              <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #1976d2;">
                  <strong>✅ Your email notifications are working correctly!</strong>
                </p>
              </div>
              <p style="color: #777; font-size: 14px;">
                Sent at: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        `,
      }

      await sgMail.send(msg)
      console.log(`✅ Test email sent successfully to: ${email}`)

      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
      })
    } catch (error: any) {
      console.error(`❌ SendGrid error:`, error)

      let errorMessage = "Failed to send email"
      if (error.response?.body?.errors) {
        errorMessage = error.response.body.errors[0]?.message || errorMessage
      } else if (error.message) {
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
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
      },
      { status: 400 },
    )
  }
}
