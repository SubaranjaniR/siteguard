"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Globe,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  BarChart3,
  Bell,
  Trash2,
  Edit,
  Upload,
  ImageIcon,
  Loader2,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { updateUserActivity, initializeSystem } from "@/lib/users"
import { initializeMonitoring, getWebsites, addWebsite, removeWebsite, calculateUptime } from "@/lib/monitoring"
import { syncUserWebsites } from "@/lib/monitoring"

interface ReferenceImage {
  label: string;
  data: string;
}

interface Website {
  id: string;
  name: string;
  url: string;
  status: "up" | "down" | "checking";
  uptime: number;
  responseTime: number;
  lastChecked: string;
  checkInterval: number;
  userEmail?: string;
  userPhone?: string;
  imageMonitoring?: boolean;
  referenceImages?: ReferenceImage[];
  lastImageCheck?: string;
  imageStatus?: "same" | "changed" | "checking";
}

export default function DashboardPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [newWebsite, setNewWebsite] = useState({
    name: "",
    url: "",
    checkInterval: 1, // Default to 1 minute for real-time monitoring
    imageMonitoring: false,
    referenceImages: [] as ReferenceImage[],
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Move useRef here
  const lastCheckedRef = useRef<{ [id: string]: number }>({})

  // Edit website state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editWebsite, setEditWebsite] = useState<Website | null>(null);
  const [editUrlError, setEditUrlError] = useState("");
  const [addUrlError, setAddUrlError] = useState("");

  // URL validation helper
  const isValidUrl = (url: string) => /^https?:\/\//.test(url);

  // Helper function to identify secure sites that block monitoring
  const isSecureSite = (url: string) => {
    const secureDomains = [
      'chatgpt.com',
      'openai.com', 
      'google.com',
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'github.com',
      'stackoverflow.com',
      'reddit.com',
      'youtube.com',
      'netflix.com',
      'amazon.com',
      'microsoft.com',
      'apple.com',
      'cloudflare.com',
      'aws.amazon.com',
      'azure.microsoft.com',
      'heroku.com',
      'vercel.com',
      'netlify.com'
    ]
    
    return secureDomains.some(domain => url.includes(domain))
  }

  // Handle edit button click
  const handleEditWebsite = (website: Website) => {
    setEditWebsite(website);
    setEditUrlError("");
    setIsEditDialogOpen(true);
  };

  // Handle save after editing
  const handleSaveEditWebsite = () => {
    if (!user || !editWebsite) {
      return;
    }
    setWebsites((prev) => {
      const updated = prev.map((w) =>
        w.id === editWebsite.id ? { ...w, ...editWebsite, referenceImages: editWebsite.referenceImages || [] } : w
      );
      localStorage.setItem(`websites_${user.id}`, JSON.stringify(updated));
      return updated;
    });
    
    // Sync with monitoring service
    syncUserWebsites()
    
    setIsEditDialogOpen(false);
    setEditWebsite(null);
  };

  // Load user data and websites on component mount
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Load user's websites
      const userWebsites = localStorage.getItem(`websites_${parsedUser.id}`) || "[]"
      const loadedWebsites = JSON.parse(userWebsites)
      setWebsites(loadedWebsites)

      console.log(`👤 Loaded user: ${parsedUser.name} (${parsedUser.email})`)
      console.log(`🌐 Loaded ${loadedWebsites.length} websites for monitoring`)
    }
  }, [])

  // Real-time monitoring effect - runs according to each website's checkInterval
  useEffect(() => {
    if (!user) return

    setIsMonitoring(true)
    console.log(`🔄 Starting real-time monitoring for user: ${user.id}`)

    let interval: NodeJS.Timeout | null = null
    let isCancelled = false

    const monitorWebsites = async () => {
      const nowMs = Date.now();
      setWebsites((prevWebsites) => {
        const updatedWebsites = prevWebsites.map((website) => {
          const intervalMs = (website.checkInterval || 1) * 60000;
          const lastChecked = lastCheckedRef.current[website.id] || 0;
          
          if (nowMs - lastChecked >= intervalMs || website.status === "checking") {
            // Mark as checked now
            lastCheckedRef.current[website.id] = nowMs;
            
            // Start real-time monitoring (async, don't block map)
            (async () => {
              try {
                console.log(`🔍 Real-time check for: ${website.name} (${website.url})`)
                
                // Server-side check to avoid CORS and false negatives
                let isUp = false
                let responseTime = 0
                let statusCode = 0
                try {
                  const apiRes = await fetch('/api/check-website', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: website.url })
                  })
                  const result = await apiRes.json()
                  isUp = result?.success === true
                  responseTime = typeof result?.responseTime === 'number' ? result.responseTime : 0
                  statusCode = typeof result?.statusCode === 'number' ? result.statusCode : 0
                  console.log(`📊 API check for ${website.name}: ${isUp ? 'UP' : 'DOWN'} (${responseTime}ms) - Status: ${statusCode}`)
                } catch (e: any) {
                  console.log(`❌ API check failed for ${website.name}:`, e?.message || e)
                  isUp = false
                  responseTime = 0
                }

                // Update website status with real data
                setWebsites((prev) =>
                  prev.map((w) =>
                    w.id === website.id
                      ? {
                          ...w,
                          status: isUp ? "up" : "down",
                          responseTime: responseTime,
                          lastChecked: "Just now",
                          uptime: isUp ? 
                            Math.min(w.uptime + 0.1, 100) : 
                            Math.max(w.uptime - 2, 0),
                        }
                      : w,
                  ),
                )

                // Save updated website data to user-specific storage
                const updatedWebsites = websites.map((w) =>
                  w.id === website.id
                    ? {
                        ...w,
                        status: isUp ? "up" : "down",
                        responseTime: responseTime,
                        lastChecked: "Just now",
                        uptime: isUp ? 
                          Math.min(w.uptime + 0.1, 100) : 
                          Math.max(w.uptime - 2, 0),
                      }
                    : w,
                )
                localStorage.setItem(`websites_${user.id}`, JSON.stringify(updatedWebsites))

                // Send notifications if website is down
                if (!isUp) {
                  console.log(`🚨 Website DOWN alert: ${website.name} (${website.url})`)
                  // In a real app, send email/SMS notifications here
                }

                // Image monitoring if enabled and website is up
                if (website.imageMonitoring && website.referenceImages && website.referenceImages.length > 0 && isUp) {
                  setWebsites((prev) =>
                    prev.map((w) => (w.id === website.id ? { ...w, imageStatus: "checking" as const } : w)),
                  );
                  
                  setTimeout(async () => {
                    try {
                      // Check all reference images
                      let anyImageChanged = false;
                      for (const refImage of website.referenceImages) {
                        try {
                          const imageResponse = await fetch("/api/monitor-image", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              url: website.url,
                              referenceImageData: refImage.data,
                              userId: user.id,
                              userEmail: user.email,
                              userPhone: user.phone,
                              websiteName: website.name,
                              imageLabel: refImage.label,
                            }),
                          });
                          const imageResult = await imageResponse.json();
                          console.log(`📸 Image monitoring result for ${website.name} - ${refImage.label}:`, imageResult);
                          if (imageResult.changed) {
                            anyImageChanged = true;
                            console.log(`🚨 Visual change detected for ${website.name} - ${refImage.label}`);
                          }
                        } catch (error) {
                          console.error(`❌ Image monitoring error for ${website.name} - ${refImage.label}:`, error);
                        }
                      }
                      
                      // Update website status based on whether any image changed
                      setWebsites((prev) =>
                        prev.map((w) =>
                          w.id === website.id
                            ? {
                                ...w,
                                imageStatus: anyImageChanged ? "changed" : "same",
                                lastImageCheck: "Just now",
                              }
                            : w,
                        ),
                      );
                      
                      // Save updated data
                      const finalWebsites = websites.map((w) =>
                        w.id === website.id
                          ? {
                              ...w,
                              imageStatus: anyImageChanged ? "changed" : "same",
                              lastImageCheck: "Just now",
                            }
                          : w,
                      )
                      localStorage.setItem(`websites_${user.id}`, JSON.stringify(finalWebsites))
                    } catch (error) {
                      console.error(`❌ Image monitoring error for ${website.name}:`, error);
                      setWebsites((prev) =>
                        prev.map((w) => (w.id === website.id ? { ...w, imageStatus: "same" as const } : w)),
                      );
                    }
                  }, 3000);
                }
              } catch (error) {
                console.error(`❌ Real-time monitoring error for ${website.name}:`, error)
                
                // Website is down due to error
                setWebsites((prev) =>
                  prev.map((w) =>
                    w.id === website.id
                      ? {
                          ...w,
                          status: "down" as const,
                          responseTime: 0,
                          lastChecked: "Error",
                          uptime: Math.max(w.uptime - 3, 0),
                        }
                      : w,
                  ),
                )
                
                // Save updated data
                const errorWebsites = websites.map((w) =>
                  w.id === website.id
                    ? {
                        ...w,
                        status: "down" as const,
                        responseTime: 0,
                        lastChecked: "Error",
                        uptime: Math.max(w.uptime - 3, 0),
                      }
                    : w,
                )
                localStorage.setItem(`websites_${user.id}`, JSON.stringify(errorWebsites))
              }
            })();
            
            // Mark as checking
            return { ...website, status: "checking" as const };
          }
          return website;
        });
        return updatedWebsites;
      });
    }

    // Initial check
    monitorWebsites()

    // Set up interval for continuous monitoring (every 30 seconds, but only checks sites due for check)
    interval = setInterval(monitorWebsites, 30000)

    return () => {
      if (interval) clearInterval(interval)
      isCancelled = true
      setIsMonitoring(false)
    }
  }, [user]) // Only depend on user

  // Add Website validation
  const handleAddWebsite = async () => {
    if (!user) return;
    if (!isValidUrl(newWebsite.url)) {
      setAddUrlError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setAddUrlError("");

    const website: Website = {
      id: Date.now().toString(),
      name: newWebsite.name,
      url: newWebsite.url,
      status: "checking",
      uptime: 100,
      responseTime: 0,
      lastChecked: "Just now",
      checkInterval: newWebsite.checkInterval,
      userEmail: user.email,
      userPhone: user.phone,
      imageMonitoring: newWebsite.imageMonitoring,
      referenceImages: newWebsite.referenceImages,
      imageStatus: "same",
    }

    const updatedWebsites = [...websites, website]
    setWebsites(updatedWebsites)

    // Save to localStorage
    localStorage.setItem(`websites_${user.id}`, JSON.stringify(updatedWebsites))

    // Sync with monitoring service
    syncUserWebsites()

    console.log(`✅ Added new website: ${website.name} (${website.url})`)
    console.log(`📧 Alerts will be sent to: ${user.email}`)
    console.log(`📱 SMS alerts will be sent to: ${user.phone}`)

    setNewWebsite({
      name: "",
      url: "",
      checkInterval: 1,
      imageMonitoring: false,
      referenceImages: [],
    })
    setIsAddDialogOpen(false)

    // Immediate check for new website
    setTimeout(async () => {
      try {
        console.log(`🔍 Running immediate check for new website: ${website.name}`)
        const response = await fetch("/api/monitor-realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: website.url,
            userId: user.id,
            userEmail: user.email,
            userPhone: user.phone,
          }),
        })
        const result = await response.json()

        setWebsites((prev) =>
          prev.map((w) =>
            w.id === website.id
              ? {
                  ...w,
                  status: result.status,
                  responseTime: result.responseTime,
                  lastChecked: "Just now",
                }
              : w,
          ),
        )

        console.log(`📊 Initial check result for ${website.name}:`, result)
      } catch (error) {
        console.error(`❌ Initial check error for ${website.name}:`, error)
      }
    }, 2000)
  }

  const handleDeleteWebsite = (id: string) => {
    const websiteToDelete = websites.find((w) => w.id === id)
    const updatedWebsites = websites.filter((w) => w.id !== id)
    setWebsites(updatedWebsites)
    if (user) {
      localStorage.setItem(`websites_${user.id}`, JSON.stringify(updatedWebsites))
    }
    
    // Sync with monitoring service
    syncUserWebsites()
    
    console.log(`🗑️ Deleted website: ${websiteToDelete?.name}`)
  }

  const handleAddReferenceImage = (event: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = event.target.files?.[0];
    if (file && label) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewWebsite((prev) => ({
          ...prev,
          referenceImages: [
            ...prev.referenceImages,
            { label, data: e.target?.result as string },
          ],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReferenceImage = (idx: number) => {
    setNewWebsite((prev) => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== idx),
    }));
  };

  const handleEditRemoveReferenceImage = (idx: number) => {
    setEditWebsite((prev) => ({
      ...prev!,
      referenceImages: prev!.referenceImages!.filter((_, i) => i !== idx),
    }));
  };

  const handleEditAddReferenceImage = (event: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = event.target.files?.[0];
    if (file && label) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditWebsite((prev) => ({
          ...prev!,
          referenceImages: [
            ...(prev!.referenceImages || []),
            { label, data: e.target?.result as string },
          ],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Clear user-specific websites data
    if (user) {
      localStorage.removeItem(`websites_${user.id}`);
    }
    window.location.href = "/login";
  };

  // Function to clear all user data (for testing)
  const clearAllUserData = () => {
    if (confirm("This will clear all user data. Are you sure?")) {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "down":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "checking":
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "up":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Online</Badge>
      case "down":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Offline</Badge>
      case "checking":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Checking...</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getImageStatusBadge = (imageStatus?: string) => {
    switch (imageStatus) {
      case "changed":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Visual Change</Badge>
      case "same":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">No Change</Badge>
      case "checking":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Checking...</Badge>
      default:
        return null
    }
  }

  const totalWebsites = websites.length
  const onlineWebsites = websites.filter((w) => w.status === "up").length
  const offlineWebsites = websites.filter((w) => w.status === "down").length
  const visualChanges = websites.filter((w) => w.imageStatus === "changed").length
  const averageUptime = websites.reduce((acc, w) => acc + w.uptime, 0) / totalWebsites || 0

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
      
      // Track user activity when they access dashboard
      updateUserActivity(currentUser.id)
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="ml-4 text-lg text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Unauthorized Access</h2>
          <p className="text-lg text-gray-700 mb-6">
            You must be logged in to access this dashboard. Please <Link href="/login" className="text-blue-600 hover:underline">log in</Link>.
          </p>
          <Button onClick={handleLogout} className="bg-blue-600 hover:bg-blue-700 text-white">
            Go to Login
          </Button>
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
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  {isMonitoring ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Live Monitoring
                    </>
                  ) : (
                    "Real-time Ready"
                  )}
                </Badge>
                {websites.length > 0 && (
                  <Badge variant="outline">Next check in {30 - (new Date().getSeconds() % 30)}s</Badge>
                )}
                {websites.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                    {websites.length} Website{websites.length !== 1 ? 's' : ''} Monitored
                  </Badge>
                )}
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/dashboard" className="text-blue-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/analytics" className="text-gray-600 hover:text-gray-900">
                  Analytics
                </Link>
                <Link href="/alerts" className="text-gray-600 hover:text-gray-900">
                  Alerts
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email ? `${user.name} (${user.email})` : "Loading..."}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              {/* Test button - remove in production */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllUserData}
                className="text-red-600 hover:text-red-700"
              >
                Clear Data (Test)
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Websites</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWebsites}</div>
              <p className="text-xs text-muted-foreground">Monitored 24/7</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onlineWebsites}</div>
              <p className="text-xs text-muted-foreground">Running smoothly</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{offlineWebsites}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visual Changes</CardTitle>
              <ImageIcon className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{visualChanges}</div>
              <p className="text-xs text-muted-foreground">Detected changes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Uptime</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageUptime.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Websites List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Real-time Website Monitoring</CardTitle>
                <CardDescription>
                  Instant alerts via email & SMS • Visual change detection • 30-second monitoring intervals
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Website
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Website</DialogTitle>
                    <DialogDescription>
                      Add a website for real-time monitoring with instant email & SMS alerts
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Website Name</Label>
                      <Input
                        id="name"
                        placeholder="My Website"
                        value={newWebsite.name}
                        onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">Website URL</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="url"
                          placeholder="https://example.com"
                          value={newWebsite.url}
                          onChange={(e) => setNewWebsite({ ...newWebsite, url: e.target.value })}
                        />
                        {newWebsite.url && /^https?:\/\//.test(newWebsite.url) && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={newWebsite.url} target="_blank" rel="noopener noreferrer">
                              Visit
                            </a>
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Try: https://httpstat.us/500 (for testing downtime alerts)
                      </p>
                      {addUrlError && <p className="text-xs text-red-600">{addUrlError}</p>}
                      {isSecureSite(newWebsite.url) && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                            <p className="text-xs text-blue-700 font-medium">Secure Site Detected</p>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            This site may block monitoring tools. We'll use special handling to check its status.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interval">Check Interval</Label>
                      <Select
                        value={newWebsite.checkInterval.toString()}
                        onValueChange={(value) =>
                          setNewWebsite({ ...newWebsite, checkInterval: Number.parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">30 seconds (Real-time)</SelectItem>
                          <SelectItem value="2">2 minutes</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="imageMonitoring"
                          checked={newWebsite.imageMonitoring}
                          onChange={(e) => setNewWebsite({ ...newWebsite, imageMonitoring: e.target.checked })}
                        />
                        <Label htmlFor="imageMonitoring">Enable Visual Change Detection</Label>
                      </div>
                      {newWebsite.imageMonitoring && (
                        <div className="space-y-2">
                          <Label>Reference Images ({newWebsite.referenceImages.length} uploaded)</Label>
                          <div className="space-y-2">
                            {newWebsite.referenceImages.length === 0 ? (
                              <p className="text-xs text-gray-500 italic">No images uploaded yet</p>
                            ) : (
                              newWebsite.referenceImages.map((img, idx) => (
                                <div key={idx} className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                                  <ImageIcon className="w-4 h-4" />
                                  <span className="font-medium">{img.label}</span>
                                  <Button variant="outline" size="sm" onClick={() => handleRemoveReferenceImage(idx)}>Remove</Button>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                              <Input id="refLabel" type="text" placeholder="Page label (e.g. Home)" style={{ width: 120 }} />
                              <Input id="refImage" type="file" accept="image/*"
                                onChange={(e) => {
                                  const labelInput = (e.target.parentElement?.querySelector('#refLabel') as HTMLInputElement);
                                  if (labelInput && labelInput.value) {
                                    handleAddReferenceImage(e, labelInput.value);
                                    labelInput.value = "";
                                    e.target.value = "";
                                  }
                                }}
                              />
                              <Button variant="outline" size="sm" onClick={() => {
                                const labelInput = document.querySelector('#refLabel') as HTMLInputElement;
                                const fileInput = document.querySelector('#refImage') as HTMLInputElement;
                                if (labelInput && fileInput && labelInput.value && fileInput.files?.[0]) {
                                  const event = { target: fileInput } as React.ChangeEvent<HTMLInputElement>;
                                  handleAddReferenceImage(event, labelInput.value);
                                  labelInput.value = "";
                                  fileInput.value = "";
                                }
                              }}>
                                <Upload className="w-4 h-4 mr-1" />
                                Add Image
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Upload screenshots of your website pages. You'll be alerted if any of them change.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button onClick={handleAddWebsite} className="w-full">
                      Add Website & Start Monitoring
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {websites.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No websites added yet</p>
                  <p className="text-sm text-gray-400">
                    Add your first website to start real-time monitoring with instant email & SMS alerts
                  </p>
                </div>
              ) : (
                websites.map((website) => (
                  <div
                    key={website.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(website.status)}
                      <div>
                        <h3 className="font-medium">{website.name}</h3>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-500">{website.url}</p>
                          {website.url && /^https?:\/\//.test(website.url) && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={website.url} target="_blank" rel="noopener noreferrer">
                                Visit
                              </a>
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {website.imageMonitoring && website.referenceImages && website.referenceImages.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <ImageIcon className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600">
                                Visual monitoring ({website.referenceImages.length} pages)
                              </span>
                            </div>
                          )}
                          {website.imageMonitoring && getImageStatusBadge(website.imageStatus)}
                          {/* Show special handling indicator for secure sites */}
                          {isSecureSite(website.url) && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                              🔒 Secure Site
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm font-medium">{calculateUptime(website.id, 60).toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{website.responseTime}ms</div>
                        <div className="text-xs text-gray-500">Response</div>
                      </div>
                      {getStatusBadge(website.status)}
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditWebsite(website)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteWebsite(website.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Status */}
        {websites.length > 0 && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">
                    Real-time monitoring active for {websites.length} website{websites.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-sm text-green-700">
                  Email alerts: {user?.email} • SMS alerts: {user?.phone}
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600">
                Last check: {new Date().toLocaleTimeString()} • Next check: {new Date(Date.now() + 30000).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Monitoring Activity */}
        {websites.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span>Live Monitoring Activity</span>
              </CardTitle>
              <CardDescription>Real-time status of all monitored websites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {websites.map((website) => (
                  <div key={website.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        website.status === 'up' ? 'bg-green-500' : 
                        website.status === 'down' ? 'bg-red-500' : 'bg-yellow-500'
                      } ${website.status === 'checking' ? 'animate-pulse' : ''}`}></div>
                      <div>
                        <h4 className="font-medium">{website.name}</h4>
                        <p className="text-sm text-gray-500">{website.url}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {website.status === 'up' ? 'Online' : 
                         website.status === 'down' ? 'Offline' : 'Checking...'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {website.responseTime}ms • {website.uptime.toFixed(1)}% uptime
                      </div>
                      <div className="text-xs text-gray-400">
                        Last: {website.lastChecked}
                      </div>
                      {/* Show special handling indicator for secure sites */}
                      {isSecureSite(website.url) && (
                        <div className="text-xs text-blue-500 mt-1">
                          🔒 Secure site (special monitoring)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Website Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Website</DialogTitle>
            <DialogDescription>Update the website details and save changes.</DialogDescription>
          </DialogHeader>
          {editWebsite && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Website Name</Label>
                <Input
                  id="edit-name"
                  value={editWebsite.name}
                  onChange={(e) => setEditWebsite({ ...editWebsite, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">Website URL</Label>
                <Input
                  id="edit-url"
                  value={editWebsite.url}
                  onChange={(e) => setEditWebsite({ ...editWebsite, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-interval">Check Interval (minutes)</Label>
                <Select
                  value={editWebsite.checkInterval.toString()}
                  onValueChange={(value) => setEditWebsite({ ...editWebsite, checkInterval: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">30 seconds (Real-time)</SelectItem>
                    <SelectItem value="2">2 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="imageMonitoring"
                    checked={editWebsite.imageMonitoring}
                    onChange={(e) => setEditWebsite({ ...editWebsite, imageMonitoring: e.target.checked })}
                  />
                  <Label htmlFor="imageMonitoring">Enable Visual Change Detection</Label>
                </div>
                {editWebsite?.imageMonitoring && (
                  <div className="space-y-2">
                    <Label>Reference Images ({(editWebsite.referenceImages || []).length} uploaded)</Label>
                    <div className="space-y-2">
                      {(editWebsite.referenceImages || []).length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No images uploaded yet</p>
                      ) : (
                        (editWebsite.referenceImages || []).map((img, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                            <ImageIcon className="w-4 h-4" />
                            <span className="font-medium">{img.label}</span>
                            <Button variant="outline" size="sm" onClick={() => handleEditRemoveReferenceImage(idx)}>Remove</Button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Input id="editRefLabel" type="text" placeholder="Page label (e.g. Home)" style={{ width: 120 }} />
                        <Input id="editRefImage" type="file" accept="image/*"
                          onChange={(e) => {
                            const labelInput = (e.target.parentElement?.querySelector('#editRefLabel') as HTMLInputElement);
                            if (labelInput && labelInput.value) {
                              handleEditAddReferenceImage(e, labelInput.value);
                              labelInput.value = "";
                              e.target.value = "";
                            }
                          }}
                        />
                        <Button variant="outline" size="sm" onClick={() => {
                          const labelInput = document.querySelector('#editRefLabel') as HTMLInputElement;
                          const fileInput = document.querySelector('#editRefImage') as HTMLInputElement;
                          if (labelInput && fileInput && labelInput.value && fileInput.files?.[0]) {
                            const event = { target: fileInput } as React.ChangeEvent<HTMLInputElement>;
                            handleEditAddReferenceImage(event, labelInput.value);
                            labelInput.value = "";
                            fileInput.value = "";
                          }
                        }}>
                          <Upload className="w-4 h-4 mr-1" />
                          Add Image
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Upload screenshots of your website pages. You'll be alerted if any of them change.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={handleSaveEditWebsite} className="w-full">
                Save Changes
              </Button>
              {editUrlError && <p className="text-xs text-red-600">{editUrlError}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
