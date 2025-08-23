import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    // Validate input
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    console.log(`🔐 New user signup attempt: ${email}`)

    // Check if user already exists
    // For server-side validation, we'll use a simple approach
    // In production, this should query a real database
    
    const userData = request.headers.get('x-user-data')
    let existingUsers = []
    
    if (userData) {
      try {
        existingUsers = JSON.parse(userData)
      } catch (e) {
        existingUsers = []
      }
    }
    
    const existingUser = existingUsers.find((u: any) => u.email === email)
    
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists. Please login instead." }, { status: 400 })
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      password, // In production, this should be hashed
      role: "user",
      plan: "free",
      createdAt: new Date().toISOString(),
    }

    console.log(`👤 Created user:`, newUser)

    // Send welcome notifications immediately
    const emailResult = await sendWelcomeEmail(newUser)
    const smsResult = await sendWelcomeSMS(newUser)

    console.log(`📧 Email result:`, emailResult)
    console.log(`📱 SMS result:`, smsResult)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      token: "mock-signup-token",
      message: "Account created successfully! Welcome email and SMS sent.",
      notifications: {
        email: emailResult,
        sms: smsResult,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })
  }
}

async function sendWelcomeEmail(user: any) {
  try {
    console.log(`📧 Sending welcome email to: ${user.email}`)

    const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        subject: "🚀 Welcome to SiteGuard Pro - Your Account is Ready!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Welcome to SiteGuard Pro!</h1>
            </div>
            <div style="padding: 30px; background: white; margin: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name}! 👋</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Your SiteGuard Pro account has been created successfully! You can now start monitoring your websites 24/7 with instant alerts.
              </p>
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1976d2; margin-top: 0;">🎯 What's Next?</h3>
                <ul style="color: #555; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Add your first website to monitor</li>
                  <li>Configure email and SMS alerts</li>
                  <li>Set up monitoring intervals</li>
                  <li>Upload reference images for visual monitoring</li>
                  <li>View real-time uptime statistics</li>
                </ul>
              </div>
              <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #f57c00;">
                  <strong>📧 Your Email:</strong> ${user.email}<br>
                  <strong>📱 Your Phone:</strong> ${user.phone}
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold;
                          display: inline-block;">
                  🚀 Start Monitoring Now →
                </a>
              </div>
              <p style="color: #777; font-size: 14px; margin-top: 30px;">
                Need help? Reply to this email or contact our support team.
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              © 2024 SiteGuard Pro. All rights reserved.
            </div>
          </div>
        `,
      }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error(`❌ Failed to send welcome email:`, error)
    return { success: false, error: error.message }
  }
}

async function sendWelcomeSMS(user: any) {
  try {
    console.log(`📱 Sending welcome SMS to: ${user.phone}`)

    const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.phone,
        message: `🚀 Welcome to SiteGuard Pro, ${user.name}! Your account is ready. Start monitoring your websites now at http://localhost:3000/dashboard`,
      }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error(`❌ Failed to send welcome SMS:`, error)
    return { success: false, error: error.message }
  }
}
