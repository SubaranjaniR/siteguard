"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Globe, Mail, Phone, Send, CheckCircle } from "lucide-react"

export default function TestNotificationsPage() {
  const [email, setEmail] = useState("test@example.com")
  const [phone, setPhone] = useState("+1234567890")
  const [website, setWebsite] = useState("https://example.com")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const testEmailNotification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          subject: "SiteGuard Pro - Test Email Notification",
          message: "This is a test email from SiteGuard Pro monitoring system.",
        }),
      })

      const data = await response.json()

      const result = {
        type: "email",
        status: data.success ? "sent" : "failed",
        message: data.success ? `Test email sent to ${email}` : `Failed to send email: ${data.error}`,
        timestamp: new Date().toLocaleString(),
      }

      setResults((prev) => [result, ...prev])

      if (data.success) {
        alert("✅ Test email sent successfully! Check your inbox.")
      } else {
        alert(`❌ Email failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Email test failed:", error)
      const result = {
        type: "email",
        status: "failed",
        message: `Email test failed: ${error}`,
        timestamp: new Date().toLocaleString(),
      }
      setResults((prev) => [result, ...prev])
    }
    setIsLoading(false)
  }

  const testSMSNotification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          message: "SiteGuard Pro test: Your website monitoring is active! 🚀",
        }),
      })

      const data = await response.json()

      const result = {
        type: "sms",
        status: data.success ? "sent" : "failed",
        message: data.success ? `Test SMS sent to ${phone}` : `Failed to send SMS: ${data.error}`,
        timestamp: new Date().toLocaleString(),
      }

      setResults((prev) => [result, ...prev])

      if (data.success) {
        alert("✅ Test SMS sent successfully! Check your phone.")
      } else {
        alert(`❌ SMS failed: ${data.error}`)
      }
    } catch (error) {
      console.error("SMS test failed:", error)
      const result = {
        type: "sms",
        status: "failed",
        message: `SMS test failed: ${error}`,
        timestamp: new Date().toLocaleString(),
      }
      setResults((prev) => [result, ...prev])
    }
    setIsLoading(false)
  }

  const testWebsiteMonitoring = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: website,
          userId: "test-user",
        }),
      })

      const data = await response.json()

      const result = {
        type: "monitor",
        status: data.status,
        message: `Website ${website} is ${data.status} (${data.responseTime}ms)`,
        timestamp: new Date().toLocaleString(),
        details: data,
      }

      setResults((prev) => [result, ...prev])
    } catch (error) {
      console.error("Monitoring test failed:", error)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SiteGuard Pro
              </span>
              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Test Mode</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Test Notifications</h1>
          <p className="text-gray-600 mt-2">Test email, SMS, and monitoring functionality</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Email Notification Test</span>
                </CardTitle>
                <CardDescription>Test email alerts functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Test Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to test"
                  />
                </div>
                <Button onClick={testEmailNotification} disabled={isLoading} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span>SMS Notification Test</span>
                </CardTitle>
                <CardDescription>Test SMS alerts functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Test Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number to test"
                  />
                </div>
                <Button onClick={testSMSNotification} disabled={isLoading} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Test SMS
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Website Monitoring Test</span>
                </CardTitle>
                <CardDescription>Test website monitoring functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Enter website URL to test"
                  />
                </div>
                <Button onClick={testWebsiteMonitoring} disabled={isLoading} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Test Website Monitoring
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>Real-time results from notification tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No tests run yet. Click a test button to start.</p>
                  ) : (
                    results.map((result, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {result.type === "email" && <Mail className="w-4 h-4 text-blue-500" />}
                            {result.type === "sms" && <Phone className="w-4 h-4 text-green-500" />}
                            {result.type === "monitor" && <Globe className="w-4 h-4 text-purple-500" />}
                            <span className="font-medium capitalize">{result.type}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <Badge variant="outline" className="text-xs">
                              {result.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{result.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{result.timestamp}</p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer">View Details</summary>
                            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
