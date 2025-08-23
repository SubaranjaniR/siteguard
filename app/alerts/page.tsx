"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Globe, Bell, Mail, Phone, Plus, Settings, Trash2, Edit, AlertTriangle, ImageIcon, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Website {
  id: string
  name: string
  url: string
  status: "up" | "down" | "checking"
  uptime: number
  responseTime: number
  lastChecked: string
  checkInterval: number
  userEmail?: string
  userPhone?: string
  imageMonitoring?: boolean
  referenceImages?: { label: string; data: string }[]
  lastImageCheck?: string
  imageStatus?: "same" | "changed" | "checking"
}

interface AlertRule {
  id: string
  name: string
  websiteId: string
  websiteName: string
  type: "downtime" | "response_time" | "ssl_expiry" | "visual_change"
  condition: string
  threshold: string
  enabled: boolean
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
  recipients: string[]
  lastTriggered?: string
  triggerCount: number
}

interface Alert {
  id: string
  ruleId: string
  websiteName: string
  type: string
  message: string
  time: string
  status: "active" | "resolved" | "acknowledged"
  severity: "critical" | "warning" | "info"
  details?: any
}

export default function AlertsPage() {
  const [user, setUser] = useState<any>(null)
  const [websites, setWebsites] = useState<Website[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({
    name: "",
    websiteId: "",
    type: "downtime" as const,
    threshold: "",
    email: true,
    sms: false,
    push: false,
    recipients: "",
  })

  // Load user data and alert rules
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Load user's websites
      const userWebsites = localStorage.getItem(`websites_${parsedUser.id}`) || "[]"
      const loadedWebsites = JSON.parse(userWebsites)
      setWebsites(loadedWebsites)

      // Load alert rules
      const savedRules = localStorage.getItem(`alertRules_${parsedUser.id}`) || "[]"
      setAlertRules(JSON.parse(savedRules))

      // Load recent alerts
      const savedAlerts = localStorage.getItem(`recentAlerts_${parsedUser.id}`) || "[]"
      setRecentAlerts(JSON.parse(savedAlerts))
    }
  }, [])

  // Save alert rules to localStorage
  const saveAlertRules = (rules: AlertRule[]) => {
    if (user) {
      localStorage.setItem(`alertRules_${user.id}`, JSON.stringify(rules))
    }
  }

  // Save alerts to localStorage
  const saveAlerts = (alerts: Alert[]) => {
    if (user) {
      localStorage.setItem(`recentAlerts_${user.id}`, JSON.stringify(alerts))
    }
  }

  // Check alert rules against current website status
  const checkAlertRules = () => {
    const newAlerts: Alert[] = []
    
    alertRules.forEach(rule => {
      if (!rule.enabled) return
      
      const website = websites.find(w => w.id === rule.websiteId)
      if (!website) return
      
      let shouldTrigger = false
      let message = ""
      let severity: "critical" | "warning" | "info" = "info"
      
      switch (rule.type) {
        case "downtime":
          if (website.status === "down") {
            shouldTrigger = true
            message = `${website.name} is currently down`
            severity = "critical"
          }
          break
          
        case "response_time":
          const responseThreshold = parseInt(rule.threshold)
          if (website.responseTime > responseThreshold) {
            shouldTrigger = true
            message = `${website.name} response time (${website.responseTime}ms) exceeds threshold (${responseThreshold}ms)`
            severity = "warning"
          }
          break
          
        case "visual_change":
          if (website.imageStatus === "changed") {
            shouldTrigger = true
            message = `Visual changes detected on ${website.name}`
            severity = "warning"
          }
          break
          
        case "ssl_expiry":
          // Simulate SSL expiry check
          const daysUntilExpiry = Math.floor(Math.random() * 60) // Random for demo
          const sslThreshold = parseInt(rule.threshold)
          if (daysUntilExpiry <= sslThreshold) {
            shouldTrigger = true
            message = `${website.name} SSL certificate expires in ${daysUntilExpiry} days`
            severity = "warning"
          }
          break
      }
      
      if (shouldTrigger) {
        const alert: Alert = {
          id: Date.now().toString(),
          ruleId: rule.id,
          websiteName: website.name,
          type: rule.type,
          message,
          time: new Date().toLocaleString(),
          status: "active",
          severity,
          details: { website, rule }
        }
        
        newAlerts.push(alert)
        
        // Update rule trigger count
        const updatedRules = alertRules.map(r => 
          r.id === rule.id 
            ? { ...r, lastTriggered: new Date().toISOString(), triggerCount: r.triggerCount + 1 }
            : r
        )
        setAlertRules(updatedRules)
        saveAlertRules(updatedRules)
      }
    })
    
    if (newAlerts.length > 0) {
      const updatedAlerts = [...newAlerts, ...recentAlerts].slice(0, 50) // Keep last 50 alerts
      setRecentAlerts(updatedAlerts)
      saveAlerts(updatedAlerts)
    }
  }

  // Check alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkAlertRules, 30000)
    return () => clearInterval(interval)
  }, [alertRules, websites])

  const handleToggleAlert = (id: string) => {
    const updatedRules = alertRules.map((rule) => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    )
    setAlertRules(updatedRules)
    saveAlertRules(updatedRules)
  }

  const handleDeleteAlert = (id: string) => {
    const updatedRules = alertRules.filter((rule) => rule.id !== id)
    setAlertRules(updatedRules)
    saveAlertRules(updatedRules)
  }

  const handleAddAlert = () => {
    const website = websites.find(w => w.id === newAlert.websiteId)
    if (!website) return
    
    const alert: AlertRule = {
      id: Date.now().toString(),
      name: newAlert.name,
      websiteId: newAlert.websiteId,
      websiteName: website.name,
      type: newAlert.type,
      condition: getConditionText(newAlert.type, newAlert.threshold),
      threshold: newAlert.threshold,
      enabled: true,
      notifications: {
        email: newAlert.email,
        sms: newAlert.sms,
        push: newAlert.push,
      },
      recipients: newAlert.recipients.split(",").map((r) => r.trim()).filter(r => r),
      triggerCount: 0
    }
    
    const updatedRules = [...alertRules, alert]
    setAlertRules(updatedRules)
    saveAlertRules(updatedRules)
    
    setNewAlert({
      name: "",
      websiteId: "",
      type: "downtime",
      threshold: "",
      email: true,
      sms: false,
      push: false,
      recipients: "",
    })
    setIsAddDialogOpen(false)
  }

  const handleAcknowledgeAlert = (alertId: string) => {
    const updatedAlerts = recentAlerts.map(alert => 
      alert.id === alertId ? { ...alert, status: "acknowledged" as const } : alert
    )
    setRecentAlerts(updatedAlerts)
    saveAlerts(updatedAlerts)
  }

  const handleResolveAlert = (alertId: string) => {
    const updatedAlerts = recentAlerts.map(alert => 
      alert.id === alertId ? { ...alert, status: "resolved" as const } : alert
    )
    setRecentAlerts(updatedAlerts)
    saveAlerts(updatedAlerts)
  }

  const getConditionText = (type: string, threshold: string) => {
    switch (type) {
      case "downtime":
        return "Website is down"
      case "response_time":
        return `Response time > ${threshold}ms`
      case "ssl_expiry":
        return `SSL expires in ${threshold} days`
      case "visual_change":
        return "Visual changes detected"
      default:
        return ""
    }
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "downtime":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "response_time":
        return <Bell className="w-4 h-4 text-yellow-500" />
      case "ssl_expiry":
        return <Settings className="w-4 h-4 text-blue-500" />
      case "visual_change":
        return <ImageIcon className="w-4 h-4 text-purple-500" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Critical</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Warning</Badge>
      case "info":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Info</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Active</Badge>
      case "resolved":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Resolved</Badge>
      case "acknowledged":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Acknowledged</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
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
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/analytics" className="text-gray-600 hover:text-gray-900">
                  Analytics
                </Link>
                <Link href="/alerts" className="text-blue-600 font-medium">
                  Alerts
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Test Alerts
              </Button>
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Alert Management</h1>
          <p className="text-gray-600 mt-2">Configure and manage your website monitoring alerts</p>
        </div>

        {/* Recent Alerts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest alerts from your monitored websites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getAlertTypeIcon(alert.type)}
                    <div>
                      <h3 className="font-medium">{alert.websiteName}</h3>
                      <p className="text-sm text-gray-500">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">{alert.time}</span>
                    {getSeverityBadge(alert.severity)}
                    {getStatusBadge(alert.status)}
                    {alert.status === "active" && (
                      <Button variant="outline" size="sm" onClick={() => handleAcknowledgeAlert(alert.id)}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {alert.status === "active" && (
                      <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert.id)}>
                        <Bell className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alert Rules</CardTitle>
                <CardDescription>Configure when and how you want to be notified</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Alert Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Alert Rule</DialogTitle>
                    <DialogDescription>Set up a new alert rule for your websites</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="alert-name">Alert Name</Label>
                      <Input
                        id="alert-name"
                        placeholder="e.g., Portfolio Downtime Alert"
                        value={newAlert.name}
                        onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alert-website">Website</Label>
                      <Select
                        value={newAlert.websiteId}
                        onValueChange={(value) => setNewAlert({ ...newAlert, websiteId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select website" />
                        </SelectTrigger>
                        <SelectContent>
                          {websites.map(website => (
                            <SelectItem key={website.id} value={website.id}>{website.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alert-type">Alert Type</Label>
                      <Select
                        value={newAlert.type}
                        onValueChange={(value: any) => setNewAlert({ ...newAlert, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="downtime">Website Downtime</SelectItem>
                          <SelectItem value="response_time">Slow Response Time</SelectItem>
                          <SelectItem value="ssl_expiry">SSL Certificate Expiry</SelectItem>
                          <SelectItem value="visual_change">Visual Change Detection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(newAlert.type as string) === "response_time" && (
                      <div className="space-y-2">
                        <Label htmlFor="threshold">Threshold (ms)</Label>
                        <Input
                          id="threshold"
                          placeholder="2000"
                          value={newAlert.threshold}
                          onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                        />
                      </div>
                    )}
                    {(newAlert.type as string) === "ssl_expiry" && (
                      <div className="space-y-2">
                        <Label htmlFor="threshold">Days Before Expiry</Label>
                        <Input
                          id="threshold"
                          placeholder="30"
                          value={newAlert.threshold}
                          onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                        />
                      </div>
                    )}
                    {(newAlert.type as string) === "visual_change" && (
                      <div className="space-y-2">
                        <Label htmlFor="threshold">Reference Image (Base64)</Label>
                        <Input
                          id="threshold"
                          placeholder="Paste base64 image data"
                          value={newAlert.threshold}
                          onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <Label>Notification Methods</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">Email</span>
                          </div>
                          <Switch
                            checked={newAlert.email}
                            onCheckedChange={(checked) => setNewAlert({ ...newAlert, email: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">SMS</span>
                          </div>
                          <Switch
                            checked={newAlert.sms}
                            onCheckedChange={(checked) => setNewAlert({ ...newAlert, sms: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Bell className="w-4 h-4" />
                            <span className="text-sm">Push Notification</span>
                          </div>
                          <Switch
                            checked={newAlert.push}
                            onCheckedChange={(checked) => setNewAlert({ ...newAlert, push: checked })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipients">Recipients</Label>
                      <Input
                        id="recipients"
                        placeholder="email@example.com, +1234567890"
                        value={newAlert.recipients}
                        onChange={(e) => setNewAlert({ ...newAlert, recipients: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddAlert} className="w-full">
                      Create Alert Rule
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getAlertTypeIcon(rule.type)}
                    <div>
                      <h3 className="font-medium">{rule.name}</h3>
                      <p className="text-sm text-gray-500">
                        {rule.websiteName} • {rule.condition}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {rule.notifications.email && <Mail className="w-3 h-3 text-blue-500" />}
                        {rule.notifications.sms && <Phone className="w-3 h-3 text-green-500" />}
                        {rule.notifications.push && <Bell className="w-3 h-3 text-purple-500" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Switch checked={rule.enabled} onCheckedChange={() => handleToggleAlert(rule.id)} />
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteAlert(rule.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
