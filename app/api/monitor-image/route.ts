import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, referenceImageData, userId, userEmail, userPhone, websiteName, imageLabel } = await request.json()

    if (!url || !referenceImageData) {
      return NextResponse.json({ error: "URL and reference image are required" }, { status: 400 })
    }

    console.log(`📸 Image monitoring check for: ${url}${imageLabel ? ` (${imageLabel})` : ''}`)

    try {
      // Capture current website screenshot
      const currentImageData = await captureWebsiteScreenshot(url)

      // Compare with reference image
      const similarity = await compareImages(referenceImageData, currentImageData)
      const threshold = 0.98 // Increased sensitivity to 98% similarity (was 0.9)

      const result = {
        url,
        websiteName,
        imageLabel,
        similarity: Math.round(similarity * 100) / 100, // Round to 2 decimal places
        threshold,
        changed: similarity < threshold,
        timestamp: new Date().toISOString(),
        changePercentage: Math.round((1 - similarity) * 100 * 100) / 100, // Round to 2 decimal places
      }

      console.log(`📸 Image comparison result for ${url}${imageLabel ? ` (${imageLabel})` : ''}: ${(similarity * 100).toFixed(1)}% similar`)

      // If significant change detected, send alert
      if (similarity < threshold) {
        const changePercentage = ((1 - similarity) * 100).toFixed(1)
        console.log(`🚨 Website VISUAL CHANGE detected: ${url}${imageLabel ? ` (${imageLabel})` : ''} (${changePercentage}% different)`)
        await sendImageChangeAlert(url, similarity, userEmail, userPhone, websiteName, imageLabel)
      }

      return NextResponse.json(result)
    } catch (error: any) {
      console.error(`❌ Image monitoring error for ${url}${imageLabel ? ` (${imageLabel})` : ''}:`, error)
      return NextResponse.json({
        url,
        imageLabel,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Image monitor error:", error)
    return NextResponse.json({ error: "Image monitoring failed" }, { status: 500 })
  }
}

async function captureWebsiteScreenshot(url: string): Promise<string> {
  console.log(`📸 Capturing screenshot of: ${url}`)

  // In a real implementation, you would use:
  // - Puppeteer with headless Chrome
  // - Playwright
  // - Screenshot API service like htmlcsstoimage.com or screenshotapi.net

  try {
    // For demo purposes, we'll simulate different scenarios
    const random = Math.random()

    if (random > 0.6) {
      // 40% chance of detecting a change (increased from 30%)
      console.log(`📸 Simulating visual change detected for: ${url}`)
      return generateMockImageData("changed")
    } else {
      // 60% chance of no change
      console.log(`📸 Simulating no visual change for: ${url}`)
      return generateMockImageData("same")
    }
  } catch (error) {
    console.error(`❌ Screenshot capture failed for ${url}:`, error)
    throw new Error(`Failed to capture screenshot: ${error.message}`)
  }
}

function generateMockImageData(type: "same" | "changed"): string {
  // Generate different mock image data based on type
  if (type === "changed") {
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==CHANGED`
  } else {
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==SAME`
  }
}

async function compareImages(image1: string, image2: string): Promise<number> {
  console.log(`🔍 Comparing images...`)

  // In a real implementation, you would use:
  // - pixelmatch library for pixel-by-pixel comparison
  // - resemblejs for structural similarity
  // - opencv for advanced image analysis

  try {
    // Simple comparison based on image data
    if (image1 === image2) {
      return 1.0 // 100% similar
    }

    // Check if images contain "CHANGED" marker (simulating visual changes)
    if (image2.includes("CHANGED")) {
      // Simulate various levels of change - more sensitive now
      const changeLevel = Math.random()
      if (changeLevel > 0.7) {
        return 0.75 // 25% change - significant (like scribbling on logo)
      } else if (changeLevel > 0.5) {
        return 0.85 // 15% change - moderate
      } else {
        return 0.92 // 8% change - minor
      }
    }

    // For real images, simulate some variation but be more sensitive
    const baseSimilarity = 0.97 // Start with 97% similarity
    const randomVariation = (Math.random() - 0.5) * 0.04 // ±2% variation
    const finalSimilarity = Math.max(0.90, Math.min(1.0, baseSimilarity + randomVariation))
    
    return finalSimilarity
  } catch (error) {
    console.error(`❌ Image comparison failed:`, error)
    return 0.95 // Default to high similarity on error
  }
}

async function sendImageChangeAlert(
  url: string,
  similarity: number,
  userEmail?: string,
  userPhone?: string,
  websiteName?: string,
  imageLabel?: string,
) {
  console.log(`🚨 SENDING IMMEDIATE IMAGE CHANGE ALERT for ${url}${imageLabel ? ` (${imageLabel})` : ''}`)

  const alertTime = new Date().toLocaleString()
  const changePercentage = ((1 - similarity) * 100).toFixed(1)
  const similarityPercentage = (similarity * 100).toFixed(1)
  const displayName = websiteName || url

  // Send email alert immediately
  if (userEmail) {
    try {
      const emailResponse = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          subject: `🔄 Visual Change Detected - ${displayName}${imageLabel ? ` (${imageLabel})` : ''}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔄 Website Visual Change Detected</h1>
              </div>
              <div style="padding: 20px; background: #fff3cd; border: 2px solid #ffeaa7;">
                <h2 style="color: #856404; margin-top: 0;">Your website appearance has changed!</h2>
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ff6b6b;">
                  <p style="margin: 5px 0;"><strong>🌐 Website:</strong> <a href="${url}" style="color: #ff6b6b;">${displayName}</a></p>
                  ${imageLabel ? `<p style="margin: 5px 0;"><strong>📄 Page:</strong> ${imageLabel}</p>` : ''}
                  <p style="margin: 5px 0;"><strong>📊 Change Detected:</strong> ${changePercentage}% different from reference</p>
                  <p style="margin: 5px 0;"><strong>🎯 Similarity Score:</strong> ${similarityPercentage}%</p>
                  <p style="margin: 5px 0;"><strong>🕐 Detected At:</strong> ${alertTime}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p style="color: #1976d2; margin: 0;">
                    <strong>🔍 What this means:</strong><br>
                    The visual appearance of your website${imageLabel ? ` (${imageLabel} page)` : ''} has changed compared to your reference image. This could be due to:
                  </p>
                  <ul style="color: #1976d2; margin: 10px 0; padding-left: 20px;">
                    <li>Content updates or modifications</li>
                    <li>Layout or design changes</li>
                    <li>New images or media</li>
                    <li>Dynamic content variations</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="http://localhost:3000/dashboard" 
                     style="background: #ff6b6b; 
                            color: white; 
                            padding: 12px 24px; 
                            text-decoration: none; 
                            border-radius: 5px;
                            font-weight: bold;
                            display: inline-block;">
                    📊 View Dashboard →
                  </a>
                </div>
                <p style="color: #856404; font-size: 14px; margin: 15px 0;">
                  Please review your website to ensure the changes are intentional. If this is expected, you can update your reference image in the dashboard.
                </p>
              </div>
              <div style="padding: 15px; background: #f8f9fa; text-align: center; font-size: 12px; color: #6c757d;">
                This is an automated alert from SiteGuard Pro Visual Monitoring. You're receiving this because visual changes were detected on your monitored website.
              </div>
            </div>
          `,
        }),
      })

      const emailResult = await emailResponse.json()
      console.log(`📧 Image change email alert result:`, emailResult)
    } catch (error) {
      console.error(`❌ Failed to send image change email:`, error)
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
          message: `🔄 VISUAL CHANGE ALERT: Your website "${displayName}"${imageLabel ? ` (${imageLabel})` : ''} has changed (${changePercentage}% different from reference). Detected at ${alertTime}. Check: http://localhost:3000/dashboard`,
        }),
      })

      const smsResult = await smsResponse.json()
      console.log(`📱 Image change SMS alert result:`, smsResult)
    } catch (error) {
      console.error(`❌ Failed to send image change SMS:`, error)
    }
  }
}
