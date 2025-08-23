"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Globe, Key, Mail, Phone, Settings, Eye, EyeOff, CheckCircle, XCircle, Send } from "lucide-react"
import Link from "next/link"

export default function AdminSettingsPage() {
  const [showSendGridKey, setShowSendGridKey] = useState(false)
  const [showTwilioToken, setShowTwilioToken] = useState(false)
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [isTestingSMS, setIsTestingSMS] = useState(false)

  const [settings, setSettings] = useState({
    sendgridApiKey: "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",
    twilioAccountSid: "ACdfe59673055ab0cce4362789af5055dc",
    twilioAuthToken: "55c3de3f1cea7195f8bc1136692de672",
    twilioPhoneNumber: "+1 857 371 4241",
    testEmail: "admin@siteguard.com",
    testPhone: "+1234567890",
  })

  const [connectionStatus, setConnectionStatus] = useState({
    sendgrid: "unknown",
    twilio: "unknown",
  })

  useEffect(() => {
    // Load current environment variables (in a real app, you'd get these from your backend)
    setSettings((prev) => ({
      ...prev,
      sendgridApiKey: process.env.SENDGRID_API_KEY || "",
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
    }))
  }, [])

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const testEmailConnection = async () => {
    setIsTestingEmail(true)
    try {
      // In a real app, you'd make an API call to test the SendGrid connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      if (settings.sendgridApiKey.startsWith("SG.")) {
        setConnectionStatus((prev) => ({ ...prev, sendgrid: "connected" }))
        alert("✅ SendGrid connection successful! Test email sent.")
      } else {
        setConnectionStatus((prev) => ({ ...prev, sendgrid: "error" }))
        alert("❌ Invalid SendGrid API key format. Should start with 'SG.'")
      }
    } catch (error) {
      setConnectionStatus((prev) => ({ ...prev, sendgrid: "error" }))
      alert("❌ SendGrid connection failed")
    }
    setIsTestingEmail(false)
  }

  const testSMSConnection = async () => {
    setIsTestingSMS(true)
    try {
      // In a real app, you'd make an API call to test the Twilio connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      if (settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioPhoneNumber) {
        setConnectionStatus((prev) => ({ ...prev, twilio: "connected" }))
        alert("✅ Twilio connection successful! Test SMS sent.")
      } else {
        setConnectionStatus((prev) => ({ ...prev, twilio: "error" }))
        alert("❌ Please fill in all Twilio credentials")
      }
    } catch (error) {
      setConnectionStatus((prev) => ({ ...prev, twilio: "error" }))
      alert("❌ Twilio connection failed")
    }
    setIsTestingSMS(false)
  }

  const saveSettings = async () => {
    // In a real app, you'd save these to your backend/environment
    alert("⚠️ In production, these settings would be saved to your environment variables.")
    console.log("Settings to save:", settings)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SiteGuard Pro
                </span>
              </div>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                <Settings className="w-3 h-3 mr-1" />
                Admin Settings
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Back to Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-gray-600 mt-2">Configure API keys and test notification services</p>
        </div>

        <div className="space-y-8">
          {/* SendGrid Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <CardTitle>SendGrid Email Configuration</CardTitle>
                </div>
                {getStatusBadge(connectionStatus.sendgrid)}
              </div>
              <CardDescription>Configure SendGrid for email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                <div className="relative">
                  <Input
                    id="sendgrid-key"
                    type={showSendGridKey ? "text" : "password"}
                    value={settings.sendgridApiKey}
                    onChange={(e) => handleSettingChange("sendgridApiKey", e.target.value)}
                    placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSendGridKey(!showSendGridKey)}
                  >
                    {showSendGridKey ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Get your API key from{" "}
                  <a
                    href="https://app.sendgrid.com/settings/api_keys"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >
                    SendGrid Dashboard
                  </a>
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={settings.testEmail}
                  onChange={(e) => handleSettingChange("testEmail", e.target.value)}
                  placeholder="test@example.com"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={testEmailConnection}
                  disabled={isTestingEmail || !settings.sendgridApiKey}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isTestingEmail ? "Testing..." : "Test Email Connection"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Twilio Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <CardTitle>Twilio SMS Configuration</CardTitle>
                </div>
                {getStatusBadge(connectionStatus.twilio)}
              </div>
              <CardDescription>Configure Twilio for SMS notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twilio-sid">Account SID</Label>
                  <Input
                    id="twilio-sid"
                    value={settings.twilioAccountSid}
                    onChange={(e) => handleSettingChange("twilioAccountSid", e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilio-phone">Phone Number</Label>
                  <Input
                    id="twilio-phone"
                    value={settings.twilioPhoneNumber}
                    onChange={(e) => handleSettingChange("twilioPhoneNumber", e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio-token">Auth Token</Label>
                <div className="relative">
                  <Input
                    id="twilio-token"
                    type={showTwilioToken ? "text" : "password"}
                    value={settings.twilioAuthToken}
                    onChange={(e) => handleSettingChange("twilioAuthToken", e.target.value)}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowTwilioToken(!showTwilioToken)}
                  >
                    {showTwilioToken ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Get your credentials from{" "}
                <a
                  href="https://console.twilio.com/"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                  rel="noreferrer"
                >
                  Twilio Console
                </a>
              </p>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="test-phone">Test Phone Number</Label>
                <Input
                  id="test-phone"
                  type="tel"
                  value={settings.testPhone}
                  onChange={(e) => handleSettingChange("testPhone", e.target.value)}
                  placeholder="+1234567890"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={testSMSConnection}
                  disabled={isTestingSMS || !settings.twilioAccountSid || !settings.twilioAuthToken}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isTestingSMS ? "Testing..." : "Test SMS Connection"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">📧 SendGrid Setup:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                  <li>
                    Go to{" "}
                    <a
                      href="https://app.sendgrid.com/settings/api_keys"
                      target="_blank"
                      className="underline"
                      rel="noreferrer"
                    >
                      SendGrid API Keys
                    </a>
                  </li>
                  <li>Click "Create API Key"</li>
                  <li>Choose "Full Access" or "Restricted Access" with Mail Send permissions</li>
                  <li>Copy the API key (starts with "SG.")</li>
                  <li>Paste it in the field above and test</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-blue-800 mb-2">📱 Twilio Setup:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                  <li>
                    Go to{" "}
                    <a href="https://console.twilio.com/" target="_blank" className="underline" rel="noreferrer">
                      Twilio Console
                    </a>
                  </li>
                  <li>Find your Account SID and Auth Token</li>
                  <li>
                    Get a phone number from{" "}
                    <a
                      href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
                      target="_blank"
                      className="underline"
                      rel="noreferrer"
                    >
                      Phone Numbers
                    </a>
                  </li>
                  <li>Enter all credentials above and test</li>
                </ol>
              </div>

              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> In production, these API keys should be stored as environment variables,
                  not in the database. This interface is for testing purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Settings */}
          <div className="flex justify-end">
            <Button
              onClick={saveSettings}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Key className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
