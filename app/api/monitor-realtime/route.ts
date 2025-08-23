import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, userId, userEmail, userPhone } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log(`🔍 Real-time monitoring check for: ${url}`)

    const startTime = Date.now()
    let monitorResult

    try {
      // Real HTTP request to check website
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(url, {
        method: "GET", // Use GET instead of HEAD for better compatibility
        signal: controller.signal,
        headers: {
          "User-Agent": "SiteGuard-Pro-Monitor/1.0 (Website Monitoring Service)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      })

      clearTimeout(timeoutId)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Get response body for content analysis
      const responseText = await response.text()
      const contentLength = responseText.length

      monitorResult = {
        url,
        status: response.ok ? "up" : "down",
        responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        contentLength,
        headers: {
          "content-type": response.headers.get("content-type"),
          server: response.headers.get("server"),
          "cache-control": response.headers.get("cache-control"),
        },
      }

      console.log(`✅ Monitor result for ${url}:`, {
        status: monitorResult.status,
        statusCode: monitorResult.statusCode,
        responseTime: monitorResult.responseTime,
        contentLength: monitorResult.contentLength,
      })

      // If website is down, send immediate alerts
      if (!response.ok) {
        console.log(`🚨 Website DOWN detected: ${url} (Status: ${response.status})`)
        await sendDowntimeAlert(url, response.status, userEmail, userPhone, responseTime)
      }
    } catch (error: any) {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      monitorResult = {
        url,
        status: "down",
        responseTime,
        statusCode: 0,
        timestamp: new Date().toISOString(),
        error: error.name === "AbortError" ? "Request timeout (15s)" : error.message,
      }

      console.log(`❌ Website DOWN (Error) for ${url}:`, {
        error: monitorResult.error,
        responseTime: monitorResult.responseTime,
      })

      await sendDowntimeAlert(url, 0, userEmail, userPhone, responseTime, error.message)
    }

    return NextResponse.json(monitorResult)
  } catch (error) {
    console.error("Monitor error:", error)
    return NextResponse.json({ error: "Monitoring failed" }, { status: 500 })
  }
}

async function sendDowntimeAlert(
  url: string,
  statusCode: number,
  userEmail?: string,
  userPhone?: string,
  responseTime?: number,
  errorMessage?: string,
) {
  console.log(`🚨 SENDING IMMEDIATE DOWNTIME ALERT for ${url}`)

  const alertTime = new Date().toLocaleString()
  const errorDetails =
    errorMessage || (statusCode === 0 ? "Connection failed - Server not responding" : `HTTP Error ${statusCode}`)

  // Send email alert immediately
  if (userEmail) {
    try {
      const emailResponse = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          subject: `🚨 URGENT: Website Down Alert - ${url}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🚨 URGENT: Website Down Alert</h1>
              </div>
              <div style="padding: 20px; background: #fff3cd; border: 2px solid #ffeaa7;">
                <h2 style="color: #856404; margin-top: 0;">Your website is currently down!</h2>
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
                  <p style="margin: 5px 0;"><strong>🌐 Website:</strong> <a href="${url}" style="color: #dc3545;">${url}</a></p>
                  <p style="margin: 5px 0;"><strong>❌ Status:</strong> ${errorDetails}</p>
                  <p style="margin: 5px 0;"><strong>⏱️ Response Time:</strong> ${responseTime}ms</p>
                  <p style="margin: 5px 0;"><strong>🕐 Detected At:</strong> ${alertTime}</p>
                  ${statusCode !== 0 ? `<p style="margin: 5px 0;"><strong>📊 HTTP Code:</strong> ${statusCode}</p>` : ""}
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p style="color: #1976d2; margin: 0;">
                    <strong>🔄 What's happening?</strong><br>
                    We're continuously monitoring your website every 30 seconds and will notify you immediately when it's back online.
                  </p>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="http://localhost:3000/dashboard" 
                     style="background: #dc3545; 
                            color: white; 
                            padding: 12px 24px; 
                            text-decoration: none; 
                            border-radius: 5px;
                            font-weight: bold;
                            display: inline-block;">
                    📊 View Dashboard →
                  </a>
                </div>
              </div>
              <div style="padding: 15px; background: #f8f9fa; text-align: center; font-size: 12px; color: #6c757d;">
                This is an automated alert from SiteGuard Pro. You're receiving this because your website monitoring detected an issue.
              </div>
            </div>
          `,
        }),
      })

      const emailResult = await emailResponse.json()
      console.log(`📧 Downtime email alert result:`, emailResult)
    } catch (error) {
      console.error(`❌ Failed to send email alert:`, error)
    }
  }

  // Send SMS alert immediately
  if (userPhone) {
    try {
      const smsResponse = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userPhone,
          message: `🚨 URGENT ALERT: Your website ${url} is DOWN! ${errorDetails}. Detected at ${alertTime}. Check dashboard: http://localhost:3000/dashboard`,
        }),
      })

      const smsResult = await smsResponse.json()
      console.log(`📱 Downtime SMS alert result:`, smsResult)
    } catch (error) {
      console.error(`❌ Failed to send SMS alert:`, error)
    }
  }
}
