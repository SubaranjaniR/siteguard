import { type NextRequest, NextResponse } from "next/server"
const sgMail = require("@sendgrid/mail")
const twilio = require("twilio")

export async function POST(request: NextRequest) {
  try {
    const { url, userId } = await request.json()

    // Monitor website logic
    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        method: "HEAD",
        timeout: 10000,
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime
      const isUp = response.ok

      // In a real app, you would save this to database
      const monitorResult = {
        url,
        status: isUp ? "up" : "down",
        responseTime,
        timestamp: new Date().toISOString(),
        statusCode: response.status,
      }

      // If website is down, trigger notifications
      if (!isUp) {
        await sendNotifications(userId, url, response.status)
      }

      return NextResponse.json(monitorResult)
    } catch (error) {
      // Website is down
      await sendNotifications(userId, url, 0)

      return NextResponse.json({
        url,
        status: "down",
        responseTime: 0,
        timestamp: new Date().toISOString(),
        statusCode: 0,
        error: "Connection failed",
      })
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

async function sendNotifications(userId: string, url: string, statusCode: number) {
  console.log(`🚨 WEBSITE DOWN ALERT!`)
  console.log(`Website: ${url}`)
  console.log(`Status Code: ${statusCode}`)
  console.log(`User ID: ${userId}`)
  console.log(`Time: ${new Date().toISOString()}`)

  // Send email notification
  await sendEmailNotification(userId, url, statusCode)

  // Send SMS notification
  await sendSMSNotification(userId, url, statusCode)
}

async function sendEmailNotification(userId: string, url: string, statusCode: number) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`⚠️ SendGrid API key not configured. Alert email would be sent for: ${url}`)
      return
    }

    console.log(`📧 Sending alert email for website: ${url}`)

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    // In a real app, get user email from database
    const userEmail = `user-${userId}@example.com` // Replace with actual user email lookup

    const msg = {
      to: userEmail,
      from: "alerts@siteguard.com", // Make sure this email is verified in SendGrid
      subject: `🚨 URGENT: Website Down Alert - ${url}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🚨 Website Down Alert</h1>
          </div>
          <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7;">
            <h2 style="color: #856404; margin-top: 0;">Your website is currently down!</h2>
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Website:</strong> <a href="${url}" style="color: #dc3545;">${url}</a></p>
              <p><strong>Status Code:</strong> ${statusCode || "Connection Failed"}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Issue:</strong> ${statusCode === 0 ? "Server not responding" : `HTTP Error ${statusCode}`}</p>
            </div>
            <p style="color: #856404;">
              We're continuously monitoring your website and will notify you immediately when it's back online.
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://siteguard.com/dashboard" 
                 style="background: #dc3545; 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 5px;
                        font-weight: bold;
                        display: inline-block;">
                View Dashboard →
              </a>
            </div>
          </div>
          <div style="padding: 15px; background: #f8f9fa; text-align: center; font-size: 12px; color: #6c757d;">
            This is an automated alert from SiteGuard Pro. To stop receiving these alerts, update your notification preferences.
          </div>
        </div>
      `,
    }

    await sgMail.send(msg)
    console.log(`✅ Alert email sent successfully for: ${url}`)
  } catch (error) {
    console.error(`❌ Failed to send alert email for ${url}:`, error)
  }
}

async function sendSMSNotification(userId: string, url: string, statusCode: number) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log(`⚠️ Twilio credentials not configured. Alert SMS would be sent for: ${url}`)
      return
    }

    console.log(`📱 Sending alert SMS for website: ${url}`)

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    // In a real app, get user phone from database
    const userPhone = `+1234567890` // Replace with actual user phone lookup

    await client.messages.create({
      body: `🚨 URGENT ALERT: Your website ${url} is down (Status: ${statusCode || "No Response"}). Check dashboard: https://siteguard.com/dashboard`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userPhone,
    })

    console.log(`✅ Alert SMS sent successfully for: ${url}`)
  } catch (error) {
    console.error(`❌ Failed to send alert SMS for ${url}:`, error)
  }
}
