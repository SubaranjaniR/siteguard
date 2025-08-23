"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Globe, TrendingUp, Clock, AlertTriangle, CheckCircle, BarChart3, Calendar, Download, ImageIcon, Activity, Loader2, RefreshCw, Trash2 } from "lucide-react"
import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { updateUserActivity, initializeSystem } from "@/lib/users"
import { 
  initializeMonitoring, 
  getWebsites, 
  getRealTimeStats, 
  getResponseTimeHistory, 
  getMonitoringData,
  isMonitoringActive,
  startMonitoring,
  stopMonitoring,
  getAnalyticsData,
  getIncidents,
  syncUserWebsites,
  deleteWebsite
} from "@/lib/monitoring"

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [timeRange, setTimeRange] = useState("24h")
  const [selectedWebsite, setSelectedWebsite] = useState("all")
  const [websites, setWebsites] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [refreshKey, setRefreshKey] = useState(0)

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = requireAuth()
      if (!currentUser) {
        setIsLoading(false)
        return
      }
      setUser(currentUser)
      
      // Initialize the user system
      initializeSystem()
      
      // Initialize monitoring system
      initializeMonitoring()
      
      // Track user activity when they access analytics
      updateUserActivity(currentUser.id)
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  // Load real-time data and set up auto-refresh
  useEffect(() => {
    if (!user) return

    // Load initial data
    loadRealTimeData()
    
    // Set up auto-refresh every 5 seconds for more real-time feel
    const interval = setInterval(() => {
      loadRealTimeData()
      setLastUpdate(new Date())
    }, 5000)
    
    return () => clearInterval(interval)
  }, [user, refreshKey])

  const loadRealTimeData = () => {
    // Sync websites from user localStorage to ensure we have the latest data
    syncUserWebsites()
    
    // Get real-time websites data
    const realTimeWebsites = getWebsites()
    setWebsites(realTimeWebsites)
    
    // Update monitoring status
    setIsMonitoring(isMonitoringActive())
  }

  // Get filtered websites based on selection
  const getFilteredWebsites = () => {
    if (selectedWebsite === "all") {
      return websites
    }
    return websites.filter(w => w.id === selectedWebsite)
  }

  // Get analytics data for filtered websites
  const getFilteredAnalyticsData = () => {
    const filteredWebsites = getFilteredWebsites()
    const stats = {
      totalWebsites: filteredWebsites.length,
      onlineWebsites: filteredWebsites.filter(w => w.status === 'up').length,
      offlineWebsites: filteredWebsites.filter(w => w.status === 'down').length,
      checkingWebsites: filteredWebsites.filter(w => w.status === 'checking').length,
      avgResponseTime: filteredWebsites.length > 0 ? 
        Math.round(filteredWebsites.reduce((acc, w) => acc + w.responseTime, 0) / filteredWebsites.length) : 0,
      avgUptime: filteredWebsites.length > 0 ? 
        Math.round(filteredWebsites.reduce((acc, w) => acc + w.uptime, 0) / filteredWebsites.length * 100) / 100 : 100
    }
    
    return {
      overview: {
        totalUptime: stats.avgUptime,
        avgResponseTime: stats.avgResponseTime,
        totalIncidents: stats.offlineWebsites,
        totalChecks: filteredWebsites.length * 24 * 7,
        visualChanges: filteredWebsites.filter(w => w.imageStatus === "changed").length,
      },
      uptimeData: filteredWebsites.map(w => ({
        time: new Date(w.lastChecked).toLocaleTimeString(),
        uptime: w.uptime,
      })),
      responseTimeData: filteredWebsites.map(w => ({
        time: new Date(w.lastChecked).toLocaleTimeString(),
        responseTime: w.responseTime,
      })),
      statusData: filteredWebsites.map(w => ({
        time: new Date(w.lastChecked).toLocaleTimeString(),
        online: w.status === 'up' ? 1 : 0,
        offline: w.status === 'down' ? 1 : 0,
      })),
      visualChangesData: filteredWebsites.map(w => ({
        time: new Date(w.lastChecked).toLocaleTimeString(),
        changes: w.imageStatus === 'changed' ? 1 : 0,
      })),
    }
  }

  // Get incidents for filtered websites
  const getFilteredIncidents = () => {
    const filteredWebsites = getFilteredWebsites()
    return filteredWebsites
      .filter(w => w.status === "down")
      .map((website, index) => ({
        id: index.toString(),
        website: website.name,
        type: "Downtime",
        duration: "Ongoing",
        time: website.lastChecked,
        status: "active",
      }))
  }

  // Get current analytics data
  const analyticsData = getFilteredAnalyticsData()
  const incidents = getFilteredIncidents()

  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1)
    loadRealTimeData()
    setLastUpdate(new Date())
  }

  const handleStartMonitoring = () => {
    startMonitoring()
    setIsMonitoring(true)
    loadRealTimeData()
  }

  const handleStopMonitoring = () => {
    stopMonitoring()
    setIsMonitoring(false)
    setRefreshKey(prev => prev + 1)
  }

  const handleDeleteWebsite = (websiteId: string) => {
    if (confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      const success = deleteWebsite(websiteId)
      if (success) {
        // Refresh the data
        setRefreshKey(prev => prev + 1)
        toast({
          title: "Website deleted",
          description: `Website "${getFilteredWebsites().find(w => w.id === websiteId)?.name}" deleted.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Failed to delete website",
          description: `Failed to delete website "${getFilteredWebsites().find(w => w.id === websiteId)?.name}".`,
          variant: "destructive",
        })
      }
    }
  }

  // Get status display information
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'up':
        return { color: 'text-green-600', bg: 'bg-green-100', text: 'Online', icon: '🟢' }
      case 'down':
        return { color: 'text-red-600', bg: 'bg-red-100', text: 'Offline', icon: '🔴' }
      case 'checking':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Checking...', icon: '🟡' }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown', icon: '⚪' }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="ml-4 text-lg text-gray-600">Loading analytics...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Unauthorized Access</h2>
          <p className="text-lg text-gray-700 mb-6">
            You must be logged in to access analytics. Please <Link href="/login" className="text-blue-600 hover:underline">log in</Link>.
          </p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Go to Login
            </Button>
          </Link>
        </Card>
      </div>
    )
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
              <div className="flex items-center space-x-2">
                {isMonitoring ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                    Live Monitoring Active (5s)
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    No Websites Monitored
                  </Badge>
                )}
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/analytics" className="text-blue-600 font-medium">
                  Analytics
                </Link>
                <Link href="/alerts" className="text-gray-600 hover:text-gray-900">
                  Alerts
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualRefresh}
                  disabled={!isMonitoring}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                {isMonitoring ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleStopMonitoring}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Stop Monitoring
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleStartMonitoring}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    Start Monitoring
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {isMonitoring && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>10s intervals</span>
                    <span>•</span>
                  </>
                )}
                <span>Last: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Real-Time Analytics</h1>
              <p className="text-gray-600 mt-2">Live insights into your website performance and monitoring data</p>
              {isMonitoring && (
                <div className="flex items-center mt-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">
                    Real-time monitoring active • Updates every 10 seconds • Last check: {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm font-medium">{lastUpdate.toLocaleTimeString()}</p>
              {isMonitoring && (
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-600">Live - 10s intervals</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Websites</SelectItem>
                {websites.map((website) => (
                  <SelectItem key={website.id} value={website.id}>
                    {website.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isMonitoring && (
            <div className="flex items-center space-x-2 ml-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Real-time data</span>
            </div>
          )}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analyticsData.overview.totalUptime.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Real-time average</p>
              <p className="text-xs text-blue-500 mt-1">Updated {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago</p>
              {isMonitoring && (
                <div className="flex items-center mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">Current average</p>
              <p className="text-xs text-blue-500 mt-1">Updated {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago</p>
              {isMonitoring && (
                <div className="flex items-center mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalIncidents}</div>
              <p className="text-xs text-muted-foreground">Currently offline</p>
              <p className="text-xs text-blue-500 mt-1">Updated {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago</p>
              {isMonitoring && (
                <div className="flex items-center mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visual Changes</CardTitle>
              <ImageIcon className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analyticsData.overview.visualChanges}</div>
              <p className="text-xs text-muted-foreground">Detected changes</p>
              <p className="text-xs text-blue-500 mt-1">Updated {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago</p>
              {isMonitoring && (
                <div className="flex items-center mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalChecks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Monitoring cycles</p>
              <p className="text-xs text-blue-500 mt-1">Updated {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago</p>
              {isMonitoring && (
                <div className="flex items-center mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Response Time Graph - Real-time data */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span>Response Time (last 24 hours) - Real-time</span>
              </CardTitle>
              <CardDescription>
                Live response time data from actual website monitoring. Updates every 5 seconds.
                {isMonitoring && (
                  <span className="text-green-600 ml-2">
                    🔴 Live monitoring active
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {websites.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No websites monitored</p>
                  <p className="text-sm text-gray-400">Add websites to see response time graphs</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getFilteredWebsites().map((website) => {
                    // Get real-time response time history
                    const responseTimeHistory = getResponseTimeHistory(website.id, 24)
                    const maxResponseTime = Math.max(...responseTimeHistory.map(h => h.responseTime), 1)
                    const minResponseTime = Math.min(...responseTimeHistory.map(h => h.responseTime))
                    const avgResponseTime = Math.round(responseTimeHistory.reduce((sum, h) => sum + h.responseTime, 0) / responseTimeHistory.length)

                    return (
                      <div key={website.id} className="border rounded-lg p-6 bg-gray-900 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-white">{website.name}</h3>
                            <p className="text-sm text-gray-400">{website.url}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Current</p>
                              <p className="text-lg font-bold text-blue-400">{website.responseTime}ms</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Uptime</p>
                              <p className="text-lg font-bold text-green-400">{website.uptime.toFixed(1)}%</p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteWebsite(website.id)}
                              className="ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Response Time Graph - Real-time data */}
                        <div className="relative">
                          {/* Y-axis labels */}
                          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400">
                            <span>{Math.ceil(maxResponseTime * 1.2)}ms</span>
                            <span>{Math.ceil(maxResponseTime * 0.8)}ms</span>
                            <span>{Math.ceil(maxResponseTime * 0.6)}ms</span>
                            <span>{Math.ceil(maxResponseTime * 0.4)}ms</span>
                            <span>{Math.ceil(maxResponseTime * 0.2)}ms</span>
                            <span>0ms</span>
                          </div>
                          
                          {/* Graph area */}
                          <div className="ml-12 relative">
                            {/* Grid lines */}
                            <div className="absolute inset-0">
                              {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className="absolute w-full border-t border-gray-700"
                                  style={{ top: `${(i / 5) * 100}%` }}
                                />
                              ))}
                            </div>
                            
                            {/* Response time line */}
                            <svg className="w-full h-32" viewBox="0 0 100 32">
                              <defs>
                                <linearGradient id="responseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
                                </linearGradient>
                              </defs>
                              
                              {/* Area fill */}
                              <path
                                d={responseTimeHistory.map((data, index) => {
                                  const x = (index / (responseTimeHistory.length - 1)) * 100
                                  const y = 32 - (data.responseTime / maxResponseTime) * 32
                                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                                }).join(' ') + ` L 100 32 L 0 32 Z`}
                                fill="url(#responseGradient)"
                              />
                              
                              {/* Line */}
                              <path
                                d={responseTimeHistory.map((data, index) => {
                                  const x = (index / (responseTimeHistory.length - 1)) * 100
                                  const y = 32 - (data.responseTime / maxResponseTime) * 32
                                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                                }).join(' ')}
                                stroke="#fbbf24"
                                strokeWidth="2"
                                fill="none"
                              />
                              
                              {/* Data points */}
                              {responseTimeHistory.map((data, index) => {
                                const x = (index / (responseTimeHistory.length - 1)) * 100
                                const y = 32 - (data.responseTime / maxResponseTime) * 32
                                return (
                                  <circle
                                    key={index}
                                    cx={x}
                                    cy={y}
                                    r="2"
                                    fill="#fbbf24"
                                  />
                                )
                              })}
                            </svg>
                            
                            {/* X-axis labels */}
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                              <span>24h ago</span>
                              <span>18h ago</span>
                              <span>12h ago</span>
                              <span>6h ago</span>
                              <span>Now</span>
                            </div>
                          </div>
                          
                          {/* Legend */}
                          <div className="absolute top-2 right-2 flex items-center space-x-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                            <span className="text-xs text-gray-400">Milliseconds</span>
                            {isMonitoring && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-400">Live data</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status indicators */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                          <div className="bg-gray-800 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400">Current Status</p>
                            <div className="flex items-center justify-center mt-2">
                              {(() => {
                                const statusInfo = getStatusInfo(website.status)
                                return (
                                  <>
                                    <span className="mr-2">{statusInfo.icon}</span>
                                    <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400">Uptime</p>
                            <p className="text-lg font-bold text-green-400">{website.uptime.toFixed(1)}%</p>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400">Last Check</p>
                            <p className="text-sm font-medium text-white">{new Date(website.lastChecked).toLocaleTimeString()}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {Math.round((Date.now() - new Date(website.lastChecked).getTime()) / 1000)}s ago
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Website Speed Monitoring */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span>Real-Time Website Speed Monitoring</span>
              </CardTitle>
              <CardDescription>
                Live speed metrics for all monitored websites - Updates every 5 seconds
                {isMonitoring && (
                  <span className="text-green-600 ml-2">
                    🔴 Live monitoring active
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {websites.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No websites monitored</p>
                  <p className="text-sm text-gray-400">Add websites to see speed metrics</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredWebsites().map((website) => {
                    // Calculate speed grade based on response time
                    const getSpeedGrade = (responseTime: number) => {
                      if (responseTime < 200) return { grade: "A", color: "text-green-600", bg: "bg-green-100" }
                      if (responseTime < 500) return { grade: "B", color: "text-blue-600", bg: "bg-blue-100" }
                      if (responseTime < 1000) return { grade: "C", color: "text-yellow-600", bg: "bg-yellow-100" }
                      if (responseTime < 2000) return { grade: "D", color: "text-orange-600", bg: "bg-orange-100" }
                      return { grade: "F", color: "text-red-600", bg: "bg-red-100" }
                    }

                    const speedGrade = getSpeedGrade(website.responseTime)
                    const uptimePercentage = website.uptime
                    const lastChecked = new Date(website.lastChecked).toLocaleString()

                    return (
                      <div key={website.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <Globe className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{website.name}</h3>
                              <p className="text-sm text-gray-500">{website.url}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={speedGrade.bg + " " + speedGrade.color}>
                              Speed Grade: {speedGrade.grade}
                            </Badge>
                            {(() => {
                              const statusInfo = getStatusInfo(website.status)
                              return (
                                <Badge className={`${statusInfo.bg} ${statusInfo.color}`}>
                                  {statusInfo.icon} {statusInfo.text}
                                </Badge>
                              )
                            })()}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteWebsite(website.id)}
                              className="ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Response Time */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Response Time</p>
                                <p className="text-xl font-bold">{website.responseTime}ms</p>
                              </div>
                              <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    website.responseTime < 200 ? "bg-green-500" :
                                    website.responseTime < 500 ? "bg-blue-500" :
                                    website.responseTime < 1000 ? "bg-yellow-500" :
                                    website.responseTime < 2000 ? "bg-orange-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${Math.min((website.responseTime / 2000) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Uptime */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Uptime</p>
                                <p className="text-xl font-bold">{uptimePercentage.toFixed(1)}%</p>
                              </div>
                              <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full bg-green-500"
                                  style={{ width: `${uptimePercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Check Interval */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Check Interval</p>
                                <p className="text-xl font-bold">{website.checkInterval}s</p>
                              </div>
                              <BarChart3 className="w-5 h-5 text-purple-500" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Every {website.checkInterval} seconds
                            </p>
                          </div>

                          {/* Last Check */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Last Check</p>
                                <p className="text-sm font-medium">{lastChecked}</p>
                              </div>
                              <Calendar className="w-5 h-5 text-gray-500" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {website.status === "checking" ? "Checking..." : 
                               `${Math.round((Date.now() - new Date(website.lastChecked).getTime()) / 1000)}s ago`}
                            </p>
                          </div>
                        </div>

                        {/* Visual Monitoring Status */}
                        {website.imageMonitoring && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <ImageIcon className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-blue-700">
                                  Visual Change Detection
                                </span>
                              </div>
                              <Badge variant={website.imageStatus === "changed" ? "destructive" : "default"}>
                                {website.imageStatus === "changed" ? "Changes Detected" : "No Changes"}
                              </Badge>
                            </div>
                            {website.referenceImages && website.referenceImages.length > 0 && (
                              <p className="text-xs text-blue-600 mt-1">
                                Monitoring {website.referenceImages.length} reference image(s)
                              </p>
                            )}
                          </div>
                        )}

                        {/* Speed Recommendations */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Speed Recommendations</h4>
                          <div className="space-y-1">
                            {website.responseTime > 1000 && (
                              <p className="text-xs text-red-600">⚠️ Response time is slow. Consider optimizing your website.</p>
                            )}
                            {website.responseTime > 2000 && (
                              <p className="text-xs text-red-600">🚨 Response time is very slow. Immediate optimization needed.</p>
                            )}
                            {website.responseTime < 500 && (
                              <p className="text-xs text-green-600">✅ Excellent response time! Your website is performing well.</p>
                            )}
                            {uptimePercentage < 99 && (
                              <p className="text-xs text-orange-600">⚠️ Uptime below 99%. Monitor for potential issues.</p>
                            )}
                          </div>
                          {isMonitoring && (
                            <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                              <span className="text-xs text-green-600">Real-time monitoring active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>
              Latest monitoring alerts and issues • 
              {isMonitoring && (
                <span className="text-green-600 ml-2">
                  🔴 Real-time monitoring active
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">No active incidents</p>
                <p className="text-sm text-gray-400">All websites are running smoothly</p>
                {isMonitoring && (
                  <div className="flex items-center justify-center mt-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm text-green-600">Real-time monitoring active</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <div>
                        <h3 className="font-medium">{incident.website}</h3>
                        <p className="text-sm text-gray-500">{incident.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{incident.duration}</p>
                      <p className="text-xs text-gray-500">{incident.time}</p>
                    </div>
                  </div>
                ))}
                {isMonitoring && (
                  <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm text-green-600">Real-time monitoring active</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Real-time monitoring status footer */}
      {isMonitoring && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Live Monitoring Active</span>
          <span className="text-xs opacity-75">5s intervals</span>
        </div>
      )}
      <Toaster />
    </div>
  )
}
