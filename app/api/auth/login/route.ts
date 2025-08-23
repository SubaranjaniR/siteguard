import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log(`🔐 Login attempt for: ${email}`)

    // Admin login
    if (email === "admin@siteguard.com" && password === "admin123") {
      console.log(`✅ Admin login successful: ${email}`)
      return NextResponse.json({
        success: true,
        user: {
          id: "admin",
          email: "admin@siteguard.com",
          name: "Admin User",
          role: "admin",
        },
        token: "mock-admin-token",
      })
    }

    // Regular user login - check if user exists
    // For server-side validation, we'll use a simple approach
    // In production, this should query a real database
    
    // Check if user exists in the request headers (simulating database check)
    const userData = request.headers.get('x-user-data')
    let users = []
    
    if (userData) {
      try {
        users = JSON.parse(userData)
      } catch (e) {
        users = []
      }
    }
    
    const user = users.find((u: any) => u.email === email)

    if (!user) {
      console.log(`❌ Login failed: Email not found - ${email}`)
      return NextResponse.json({ error: "Email not found. Please sign up first." }, { status: 401 })
    }

    // In a real app, you would hash and compare passwords
    // For now, we'll use a simple check
    if (password !== user.password) {
      console.log(`❌ Login failed: Invalid password for ${email}`)
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    console.log(`✅ User login successful: ${email}`)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: "user",
      },
      token: "mock-user-token",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 400 })
  }
}
