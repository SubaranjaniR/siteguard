// Simple in-memory user storage (in production, use a real database)
let users: any[] = []
let isInitialized = false

export interface User {
  id: string
  name: string
  email: string
  phone: string
  password: string
  role: 'user' | 'admin'
  plan: 'free' | 'pro' | 'enterprise'
  status?: 'active' | 'suspended' | 'pending'
  createdAt: string
}

// Initialize admin user if it doesn't exist
function initializeAdminUser() {
  if (typeof window === 'undefined') return // SSR safety
  
  const adminExists = users.find(user => user.email === 'admin@siteguard.com')
  
  if (!adminExists) {
    const adminUser: User = {
      id: 'admin',
      name: 'Admin User',
      email: 'admin@siteguard.com',
      phone: 'N/A',
      password: 'admin123',
      role: 'admin',
      plan: 'enterprise',
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    
    users.push(adminUser)
    
    // Save to localStorage
    localStorage.setItem('siteguard_users', JSON.stringify(users))
    console.log('✅ Admin user initialized')
  }
}

// Initialize the system (call this on client side)
export function initializeSystem() {
  if (isInitialized || typeof window === 'undefined') return
  
  try {
    // Load from localStorage if available
    const storedUsers = localStorage.getItem('siteguard_users')
    if (storedUsers) {
      users = JSON.parse(storedUsers)
    }
    
    // Ensure admin user exists
    initializeAdminUser()
    
    isInitialized = true
  } catch (error) {
    console.error('Error initializing user system:', error)
  }
}

export function getAllUsers(): User[] {
  if (!isInitialized) {
    initializeSystem()
  }
  return users
}

export function getUserByEmail(email: string): User | null {
  if (!isInitialized) {
    initializeSystem()
  }
  return users.find(user => user.email === email) || null
}

export function getUserById(id: string): User | null {
  if (!isInitialized) {
    initializeSystem()
  }
  return users.find(user => user.id === id) || null
}

export function createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  if (!isInitialized) {
    initializeSystem()
  }
  
  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: userData.status || 'active'
  }
  
  users.push(newUser)
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('siteguard_users', JSON.stringify(users))
  }
  
  return newUser
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  if (!isInitialized) {
    initializeSystem()
  }
  
  const userIndex = users.findIndex(user => user.id === id)
  if (userIndex === -1) return null
  
  users[userIndex] = { ...users[userIndex], ...updates }
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('siteguard_users', JSON.stringify(users))
  }
  
  return users[userIndex]
}

export function deleteUser(id: string): boolean {
  if (!isInitialized) {
    initializeSystem()
  }
  
  const userIndex = users.findIndex(user => user.id === id)
  if (userIndex === -1) return false
  
  users.splice(userIndex, 1)
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('siteguard_users', JSON.stringify(users))
    
    // Also remove user-specific data
    localStorage.removeItem(`websites_${id}`)
    localStorage.removeItem(`lastActivity_${id}`)
  }
  
  return true
}

export function validateUser(email: string, password: string): User | null {
  if (!isInitialized) {
    initializeSystem()
  }
  
  const user = getUserByEmail(email)
  if (!user) return null
  
  // In production, use proper password hashing
  if (user.password === password) {
    return user
  }
  
  return null
}

export function updateUserActivity(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`lastActivity_${userId}`, new Date().toISOString())
  }
}

// Note: Website management is now handled by the monitoring service
// These functions are kept for backward compatibility but may be deprecated
export function getUserWebsites(userId: string): any[] {
  if (typeof window !== 'undefined') {
    const websites = localStorage.getItem(`websites_${userId}`)
    return websites ? JSON.parse(websites) : []
  }
  return []
}

export function setUserWebsites(userId: string, websites: any[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`websites_${userId}`, JSON.stringify(websites))
  }
}
