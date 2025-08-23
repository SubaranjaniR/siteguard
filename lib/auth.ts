import { NextRequest, NextResponse } from 'next/server'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'user' | 'admin'
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  try {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (!userData || !token) return null
    
    const user = JSON.parse(userData)
    return user
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

export function requireAuth() {
  const user = getCurrentUser()
  
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }
  
  return user
}

export function requireAdmin() {
  const user = requireAuth()
  
  if (!user || user.role !== 'admin') {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login'
    }
    return null
  }
  
  return user
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === 'admin'
}
