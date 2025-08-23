"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Users, Shield, BarChart3, Search, MoreHorizontal, Ban, CheckCircle, Mail, Phone, Loader2, Eye, MessageSquare, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { requireAdmin } from "@/lib/auth"
import { getAllUsers, deleteUser, updateUser, initializeSystem } from "@/lib/users"
import Link from "next/link"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  phone: string
  status: "active" | "suspended" | "pending"
  plan: "free" | "pro" | "enterprise"
  websites: number
  joinDate: string
  lastActive: string
  role: "user" | "admin"
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = requireAdmin()
      if (!currentUser) {
        setIsLoading(false)
        return
      }
      setUser(currentUser)
      
      // Initialize the user system
      initializeSystem()
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  // Load real users data
  useEffect(() => {
    if (!user) return

    const loadRealUsers = () => {
      try {
        // Get all registered users from localStorage
        const allUsers = getAllUsers()
        
        // Get websites data for each user
        const usersWithWebsites = allUsers.map(user => {
          const userWebsites = localStorage.getItem(`websites_${user.id}`)
          const websites = userWebsites ? JSON.parse(userWebsites).length : 0
          
          // Calculate last active based on recent activity
          const lastActivity = localStorage.getItem(`lastActivity_${user.id}`)
          const lastActive = lastActivity ? formatLastActive(lastActivity) : "Never"
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || "N/A",
            status: user.status || "active",
            plan: user.plan || "free",
            websites,
            joinDate: formatDate(user.createdAt),
            lastActive,
            role: user.role
          }
        })

        // Filter out admin users from the list (they shouldn't be managed)
        const nonAdminUsers = usersWithWebsites.filter(u => u.role !== 'admin')
        setUsers(nonAdminUsers)
      } catch (error) {
        console.error('Error loading users:', error)
        setUsers([])
      }
    }

    loadRealUsers()
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(loadRealUsers, 5000)
    
    return () => clearInterval(interval)
  }, [user, refreshKey])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "Unknown"
    }
  }

  const formatLastActive = (timestamp: string) => {
    try {
      const now = new Date()
      const lastActive = new Date(timestamp)
      const diffMs = now.getTime() - lastActive.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins} minutes ago`
      if (diffHours < 24) return `${diffHours} hours ago`
      if (diffDays < 7) return `${diffDays} days ago`
      return formatDate(timestamp)
    } catch {
      return "Unknown"
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      switch (action) {
        case "suspend":
          await updateUser(userId, { status: "suspended" })
          toast.success("User suspended successfully")
          break
        case "activate":
          await updateUser(userId, { status: "active" })
          toast.success("User activated successfully")
          break
        case "delete":
          if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            await deleteUser(userId)
            toast.success("User deleted successfully")
          }
          break
        case "view":
          // Navigate to user details (you can implement this later)
          toast.info("View user details - Feature coming soon")
          break
        case "message":
          // Send message functionality (you can implement this later)
          toast.info("Send message - Feature coming soon")
          break
      }
      
      // Refresh the data
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      toast.error("Failed to perform action")
      console.error('Error performing user action:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Suspended</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "free":
        return <Badge variant="outline">Free</Badge>
      case "pro":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Pro</Badge>
      case "enterprise":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Enterprise</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesPlan = planFilter === "all" || user.plan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  // Real-time statistics
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.status === "active").length
  const suspendedUsers = users.filter((u) => u.status === "suspended").length
  const totalWebsites = users.reduce((acc, u) => acc + u.websites, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="ml-4 text-lg text-gray-600">Loading admin panel...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Unauthorized Access</h2>
          <p className="text-lg text-gray-700 mb-6">
            You must be logged in as an admin to access this panel. Please <Link href="/admin/login" className="text-blue-600 hover:underline">log in</Link>.
          </p>
          <Link href="/admin/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Go to Admin Login
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
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                <Shield className="w-3 h-3 mr-1" />
                Admin Panel
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">admin@siteguard.com</span>
              <Button variant="outline" size="sm" onClick={() => {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                window.location.href = "/admin/login"
              }}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Real-time data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
              <p className="text-xs text-muted-foreground">Real-time data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <Ban className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{suspendedUsers}</div>
              <p className="text-xs text-muted-foreground">Real-time data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Websites</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWebsites}</div>
              <p className="text-xs text-muted-foreground">Real-time data</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users, monitor activity, and control access</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  Auto-refresh every 5s
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setRefreshKey(prev => prev + 1)}
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Websites</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No users found. {users.length === 0 ? "No users have registered yet." : "Try adjusting your search filters."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm mt-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{user.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{getPlanBadge(user.plan)}</TableCell>
                        <TableCell>{user.websites}</TableCell>
                        <TableCell>{user.joinDate}</TableCell>
                        <TableCell>{user.lastActive}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUserAction(user.id, "view")}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction(user.id, "message")}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              {user.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, "suspend")}
                                  className="text-red-600"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, "activate")}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, "delete")}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
