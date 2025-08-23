"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Globe, Eye, Code, Settings, Users, BarChart3, Bell } from "lucide-react"
import Link from "next/link"

export default function PreviewGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SiteGuard Pro
            </span>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Preview Guide</Badge>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Project Preview Guide</h1>
          <p className="text-gray-600 mt-2">Step-by-step guide to preview and test your SiteGuard Pro project</p>
        </div>

        {/* Current Status */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">✅ Project Status: Ready for Preview</CardTitle>
            <CardDescription className="text-green-700">
              All pages are working and the project is fully functional without a database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">All pages accessible</span>
              </div>
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">Mock data working</span>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">All features functional</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Pages */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🌐 Available Pages & Features</CardTitle>
            <CardDescription>All pages are working with mock data - no database required</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Public Pages</h3>
                <div className="space-y-2">
                  <Link href="/">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Globe className="w-4 h-4 mr-2" />
                      Landing Page (/)
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Users className="w-4 h-4 mr-2" />
                      User Login (/login)
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Users className="w-4 h-4 mr-2" />
                      User Signup (/signup)
                    </Button>
                  </Link>
                  <Link href="/admin/login">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Login (/admin/login)
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">User Dashboard</h3>
                <div className="space-y-2">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Main Dashboard (/dashboard)
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics (/analytics)
                    </Button>
                  </Link>
                  <Link href="/alerts">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Bell className="w-4 h-4 mr-2" />
                      Alerts (/alerts)
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Settings className="w-4 h-4 mr-2" />
                      User Settings (/settings)
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Admin Panel</h3>
                <div className="space-y-2">
                  <Link href="/admin">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Users className="w-4 h-4 mr-2" />
                      Admin Dashboard (/admin)
                    </Button>
                  </Link>
                  <Link href="/admin/settings">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Settings (/admin/settings)
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Testing Pages</h3>
                <div className="space-y-2">
                  <Link href="/test-notifications">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Bell className="w-4 h-4 mr-2" />
                      Test Notifications (/test-notifications)
                    </Button>
                  </Link>
                  <Link href="/preview-guide">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Guide (/preview-guide)
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Credentials */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">🔐 Login Credentials</CardTitle>
            <CardDescription className="text-blue-700">Use these credentials to test the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-800">Regular User Login</h3>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm">
                    <strong>Email:</strong> Any email (e.g., user@example.com)
                  </p>
                  <p className="text-sm">
                    <strong>Password:</strong> Any password (6+ characters)
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-800">Admin Login</h3>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm">
                    <strong>Email:</strong> admin@siteguard.com
                  </p>
                  <p className="text-sm">
                    <strong>Password:</strong> admin123
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Working */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>✨ Working Features</CardTitle>
            <CardDescription>All these features are fully functional with mock data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">✅ Authentication</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• User signup with validation</li>
                  <li>• User login with role detection</li>
                  <li>• Admin login with separate access</li>
                  <li>• Password visibility toggles</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">✅ Dashboard Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Website monitoring dashboard</li>
                  <li>• Add/edit/delete websites</li>
                  <li>• Real-time status indicators</li>
                  <li>• Statistics and metrics</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">✅ Analytics & Alerts</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Detailed analytics charts</li>
                  <li>• Uptime percentage tracking</li>
                  <li>• Alert rule management</li>
                  <li>• Notification preferences</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">✅ Admin Panel</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• User management interface</li>
                  <li>• API key configuration</li>
                  <li>• System settings</li>
                  <li>• Email/SMS testing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email/SMS Status */}
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">📧 Email & SMS Status</CardTitle>
            <CardDescription className="text-yellow-700">
              Notifications are simulated in console - configure API keys for real sending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-yellow-800 mb-2">Current Status:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• ✅ Signup process works (shows console logs)</li>
                  <li>• ✅ Email/SMS simulation in browser console</li>
                  <li>• ⚠️ Real sending requires API key configuration</li>
                  <li>• ✅ Test pages available for API testing</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-yellow-800 mb-2">To Enable Real Sending:</h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Configure SendGrid API key in environment variables</li>
                  <li>Configure Twilio credentials in environment variables</li>
                  <li>Use the admin settings page to test connections</li>
                  <li>Visit /test-notifications to verify functionality</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Information */}
        <Card className="mb-8 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">🗄️ Database Information</CardTitle>
            <CardDescription className="text-purple-700">
              Project works without database using mock data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-purple-800 mb-2">Current Setup:</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• ✅ All features work with mock data</li>
                  <li>• ✅ No database connection required for preview</li>
                  <li>• ✅ SQL scripts provided for production setup</li>
                  <li>• ✅ Data persists during session (localStorage)</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-purple-800 mb-2">SQL Scripts Available:</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• scripts/create-database.sql - Database schema</li>
                  <li>• scripts/seed-data.sql - Sample data</li>
                  <li>• Ready for PostgreSQL, MySQL, or SQLite</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Next Steps</CardTitle>
            <CardDescription>How to deploy and configure for production</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">For Production Deployment:</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Set up a database (PostgreSQL recommended)</li>
                    <li>Run the provided SQL scripts</li>
                    <li>Configure environment variables</li>
                    <li>Set up SendGrid for emails</li>
                    <li>Set up Twilio for SMS</li>
                    <li>Deploy to Vercel/Netlify/AWS</li>
                  </ol>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">For Local Development:</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Download the project code</li>
                    <li>Run `npm install`</li>
                    <li>Set up `.env.local` file</li>
                    <li>Run `npm run dev`</li>
                    <li>Access at localhost:3000</li>
                    <li>Configure API keys as needed</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
