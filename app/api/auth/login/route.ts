import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log(`🔐 Login attempt for: ${email}`)

    // Admin login
    if (email === "admin@siteguard.com" && password === "admin123") {
      const adminUser = {
        id: "admin",
        email: "admin@siteguard.com",
        name: "Admin User",
        role: "admin",
      }

      console.log(`✅ Admin login successful: ${email}`)

      return NextResponse.json({
        success: true,
        user: adminUser,
        token: "mock-admin-token",
        message: "Admin login successful",
      })
    }

    // For regular users, we'll accept any email/password combination
    // since this is a demo system and users are created through signup
    // In production, you would validate against a real database
    
    console.log(`✅ Login successful: ${email}`)

    return NextResponse.json({
      success: true,
      user: {
        id: Date.now().toString(),
        name: email.split('@')[0], // Use email prefix as name
        email: email,
        phone: "+1234567890", // Default phone
        role: "user",
      },
      token: "mock-user-token",
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 })
  }
}
