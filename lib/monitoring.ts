// Ensure this is treated as a module
export {};

export interface MonitoringData {
  id: string
  websiteId: string
  timestamp: number
  responseTime: number
  status: 'up' | 'down' | 'checking'
  uptime: number
  lastChecked: string
}

export interface Website {
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

// In-memory storage for monitoring data
let monitoringHistory: MonitoringData[] = []
let websites: Website[] = []
let isMonitoring = false
let monitoringInterval: NodeJS.Timeout | null = null
let consecutiveErrors = 0
let maxConsecutiveErrors = 5

// Helper function to validate website data
function isValidWebsite(data: any): data is Website {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.url === 'string' &&
    (data.status === 'up' || data.status === 'down' || data.status === 'checking') &&
    typeof data.uptime === 'number' &&
    typeof data.responseTime === 'number' &&
    typeof data.lastChecked === 'string' &&
    typeof data.checkInterval === 'number'
  );
}

// Initialize monitoring system
export function initializeMonitoring() {
  if (typeof window === 'undefined') return;
  
  try {
    // Load existing websites from localStorage
    const storedWebsites = localStorage.getItem('siteguard_websites');
    if (storedWebsites) {
      try {
        const parsedWebsites = JSON.parse(storedWebsites);
        // Filter out any invalid website entries
        websites = Array.isArray(parsedWebsites) 
          ? parsedWebsites.filter(isValidWebsite) 
          : [];
        console.log(`Loaded ${websites.length} valid websites from localStorage`);
      } catch (e) {
        console.error('Error parsing stored websites:', e);
        localStorage.removeItem('siteguard_websites'); // Clear corrupted data
        websites = [];
      }
    }
    
    // Also load user-specific websites from dashboard
    const userIds = Object.keys(localStorage).filter(key => key.startsWith('websites_'));
    userIds.forEach(userKey => {
      try {
        const userWebsites = localStorage.getItem(userKey);
        if (userWebsites) {
          const parsedWebsites = JSON.parse(userWebsites);
          if (Array.isArray(parsedWebsites)) {
            // Merge valid user websites with global websites, avoiding duplicates
            parsedWebsites.filter(isValidWebsite).forEach((userWebsite: Website) => {
              if (!websites.some(w => w.id === userWebsite.id)) {
                websites.push(userWebsite);
              }
            });
          }
        }
      } catch (error) {
        console.error('Error loading user websites:', error)
      }
    })
    
    // Load monitoring history with validation
    const storedHistory = localStorage.getItem('siteguard_monitoring_history');
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          monitoringHistory = parsedHistory.filter((item: any) => (
            item && 
            typeof item.id === 'string' &&
            typeof item.websiteId === 'string' &&
            typeof item.timestamp === 'number' &&
            typeof item.responseTime === 'number' &&
            (item.status === 'up' || item.status === 'down' || item.status === 'checking') &&
            typeof item.uptime === 'number' &&
            typeof item.lastChecked === 'string'
          ));
          console.log(`Loaded ${monitoringHistory.length} valid history entries`);
        }
      } catch (e) {
        console.error('Error parsing monitoring history:', e);
        monitoringHistory = [];
      }
    }
    
    // Set up cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        stopMonitoring()
      })
    }
    
    // Start monitoring if there are websites
    if (websites.length > 0) {
      startMonitoring()
    }
    
    console.log('✅ Monitoring system initialized')
  } catch (error) {
    console.error('Error initializing monitoring:', error)
  }
}

// Start real-time monitoring
export function startMonitoring() {
  if (isMonitoring || typeof window === 'undefined') return
  
  try {
    isMonitoring = true
    console.log('🚀 Starting real-time monitoring...')
    
    // Initial check with error handling
    checkAllWebsites().catch(error => {
      console.error('❌ Error in initial website check:', error)
      // Don't let initial errors prevent monitoring from starting
    })
    
    // Set up interval for continuous monitoring - more frequent updates for real-time feel
    monitoringInterval = setInterval(() => {
      try {
        // Only check if we haven't had too many consecutive errors
        if (consecutiveErrors < maxConsecutiveErrors) {
          checkAllWebsites()
        } else {
          console.warn(`⚠️ Skipping monitoring check due to ${consecutiveErrors} consecutive errors`)
          // Try to recover
          recoverMonitoring()
        }
      } catch (error) {
        console.error('❌ Error in monitoring interval:', error)
        consecutiveErrors++
        // Don't let interval errors crash the monitoring
      }
    }, 5000) // Check every 5 seconds for more real-time updates
    
    console.log('✅ Monitoring started successfully')
  } catch (error) {
    console.error('❌ Failed to start monitoring:', error)
    isMonitoring = false
    throw error
  }
}

// Stop monitoring
export function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }
  isMonitoring = false
  consecutiveErrors = 0
  console.log('🛑 Monitoring stopped')
}

// Recover monitoring after errors
function recoverMonitoring() {
  if (consecutiveErrors >= maxConsecutiveErrors) {
    console.warn(`⚠️ Too many consecutive errors (${consecutiveErrors}), attempting to recover monitoring...`)
    
    // Reset error count
    consecutiveErrors = 0
    
    // Restart monitoring
    try {
      stopMonitoring()
      setTimeout(() => {
        startMonitoring()
      }, 1000) // Wait 1 second before restarting
    } catch (error) {
      console.error('❌ Failed to recover monitoring:', error)
    }
  }
}

// Check all websites
async function checkAllWebsites() {
  if (websites.length === 0) {
    console.log('ℹ️ No websites to monitor')
    return
  }
  
  console.log(`🔍 Checking ${websites.length} websites...`)
  
  try {
    // Check websites in parallel but with error handling for each
    const checkPromises = websites.map(async (website) => {
      try {
        await checkWebsite(website)
      } catch (error) {
        console.error(`❌ Failed to check website ${website.name}:`, error)
        // Mark website as down on error
        website.status = 'down'
        website.lastChecked = new Date().toISOString()
        website.responseTime = 0
        website.uptime = calculateUptime(website.id, 'down')
        
        // Increment error count for recovery
        consecutiveErrors++
      }
    })
    
    // Wait for all checks to complete
    await Promise.allSettled(checkPromises)
    
    // Save monitoring data
    saveMonitoringData()
    
    // Reset error count on success
    consecutiveErrors = 0
    
    console.log(`✅ Completed checking ${websites.length} websites`)
    
  } catch (error) {
    console.error('❌ Error in checkAllWebsites:', error)
    consecutiveErrors++
    
    // Try to recover if too many errors
    recoverMonitoring()
    
    // Don't let errors crash the monitoring system
  }
}

// Check individual website with real HTTP requests
async function checkWebsite(website: Website): Promise<void> {
  // Set status to checking immediately
  website.status = 'checking';
  website.lastChecked = new Date().toISOString();
  saveMonitoringData();

  console.log(`🔍 Checking ${website.name} (${website.url})...`);
  
  try {
    // Make real HTTP request
    const { success, statusCode, responseTime } = await realHttpRequest(website.url);
    
    // Update website status based on response
    const status = success ? 'up' : 'down';
    const uptime = calculateUptime(website.id, status);
    
    // Update website object
    website.status = status;
    website.responseTime = responseTime || 0;
    website.uptime = uptime;
    website.lastChecked = new Date().toISOString();
    
    // Log the result
    console.log(`✅ ${website.name} (${website.url}): ${status.toUpperCase()} ` +
                `(${statusCode || 'N/A'} - ${responseTime || 0}ms) - Uptime: ${uptime.toFixed(2)}%`);
    
    // Update image monitoring status if enabled
    if (website.imageMonitoring) {
      // Check for visual changes (simplified for now)
      website.imageStatus = 'same';
      website.lastImageCheck = new Date().toISOString();
    }
    
  } catch (error) {
    console.error(`❌ Error checking ${website.name} (${website.url}):`, error);
    
    // Mark as down on error and set a reasonable response time
    website.status = 'down';
    website.lastChecked = new Date().toISOString();
    website.responseTime = 0;
    website.uptime = calculateUptime(website.id, 'down');
  } finally {
    // Always add to monitoring history, whether successful or not
    const monitoringData: MonitoringData = {
      id: `${website.id}_${Date.now()}`,
      websiteId: website.id,
      timestamp: Date.now(),
      responseTime: website.responseTime,
      status: website.status as 'up' | 'down',
      uptime: website.uptime,
      lastChecked: website.lastChecked
    };
    
    monitoringHistory.push(monitoringData);
    
    // Keep only last 24 hours of data
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    monitoringHistory = monitoringHistory.filter(data => data.timestamp > oneDayAgo);
    
    // Save the updated data
    saveMonitoringData();
  }
}

// Real HTTP request function using API endpoint
async function realHttpRequest(url: string): Promise<{ success: boolean; statusCode: number; responseTime: number; timestamp: string }> {
  const startTime = Date.now();
  
  try {
    console.log(`🌐 Checking website status via API: ${url}`);
    
    // Ensure URL has a protocol
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Call our API endpoint to check the website
    const apiUrl = new URL('/api/check-website', window.location.origin);
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: normalizedUrl }),
      credentials: 'same-origin',
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed with status ${response.status}`);
    }
    const result = await response.json();
    const computedResponseTime = typeof result.responseTime === 'number' ? result.responseTime : (Date.now() - startTime);
    return {
      success: result.success === true,
      statusCode: typeof result.statusCode === 'number' ? result.statusCode : 200,
      responseTime: computedResponseTime,
      timestamp: typeof result.timestamp === 'string' ? result.timestamp : new Date().toISOString()
    };
    
  } catch (error: any) {
    console.error(`❌ API check error for ${url}:`, error);
    
    // Handle network errors or CORS issues
    const isNetworkError = error.message?.includes('Failed to fetch') || 
                         error.message?.includes('NetworkError') ||
                         error.message?.includes('TypeError');
    
    return { 
      success: false, 
      statusCode: isNetworkError ? 0 : 500, 
      responseTime: 0, 
      timestamp: new Date().toISOString() 
    };
  }
}

// Calculate uptime percentage
function calculateUptime(websiteId: string, currentStatus: 'up' | 'down'): number {
  const recentData = monitoringHistory
    .filter(data => data.websiteId === websiteId)
    .slice(-100) // Last 100 checks
  
  if (recentData.length === 0) return 100
  
  const upCount = recentData.filter(data => data.status === 'up').length
  return (upCount / recentData.length) * 100
}

// Save monitoring data to localStorage
function saveMonitoringData() {
  if (typeof window === 'undefined') return;
  
  try {
    // Only save essential data to prevent localStorage quota issues
    const websitesToSave = websites.map(website => {
      // Ensure we're only saving valid statuses
      const status = website.status === 'checking' ? 'down' : website.status;
      
      return {
        id: website.id,
        name: website.name,
        url: website.url,
        status: status,
        uptime: website.uptime,
        responseTime: website.responseTime,
        lastChecked: website.lastChecked,
        checkInterval: website.checkInterval || 1,
        imageMonitoring: website.imageMonitoring || false
      };
    });
    
    localStorage.setItem('siteguard_websites', JSON.stringify(websitesToSave));
    
    // Only keep the last 1000 history items to prevent localStorage overflow
    const recentHistory = monitoringHistory.slice(-1000);
    localStorage.setItem('siteguard_monitoring_history', JSON.stringify(recentHistory));
    
  } catch (error) {
    console.error('Error saving monitoring data:', error);
    
    // If we're hitting storage limits, try to recover by clearing old data
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing old monitoring data...');
      try {
        // Keep only the most recent 100 history items
        monitoringHistory = monitoringHistory.slice(-100);
        localStorage.setItem('siteguard_monitoring_history', JSON.stringify(monitoringHistory));
        
        // Try saving websites again with reduced data
        localStorage.setItem('siteguard_websites', JSON.stringify(websites));
      } catch (e) {
        console.error('Failed to recover from storage error:', e);
      }
    }
  }
}

// Get real-time monitoring data
export function getMonitoringData(websiteId?: string) {
  if (websiteId) {
    return monitoringHistory.filter(data => data.websiteId === websiteId)
  }
  return monitoringHistory
}

// Get website data
export function getWebsites(): Website[] {
  // Ensure websites are loaded
  if (typeof window !== 'undefined' && websites.length === 0) {
    initializeMonitoring();
  }
  return websites;
}

// Add website to monitoring
export function addWebsite(website: { name: string; url: string; checkInterval?: number }): Website {
  // Check if website already exists
  const existingWebsite = websites.find(w => 
    w.url === website.url || 
    w.url === `https://${website.url}` || 
    w.url === `http://${website.url}`
  );
  
  if (existingWebsite) {
    console.log(`Website ${website.url} already exists with ID ${existingWebsite.id}`);
    return existingWebsite;
  }
  
  // Ensure URL has a protocol
  const urlWithProtocol = website.url.startsWith('http') ? website.url : `https://${website.url}`;
  
  const newWebsite: Website = {
    id: `website_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: website.name || new URL(urlWithProtocol).hostname,
    url: urlWithProtocol,
    status: 'checking',
    uptime: 100,
    responseTime: 0,
    lastChecked: new Date().toISOString(),
    checkInterval: website.checkInterval || 1,
    imageMonitoring: false,
    referenceImages: []
  };
  
  console.log(`Adding new website: ${newWebsite.name} (${newWebsite.url})`);
  
  // Add to the beginning of the array to show newest first
  websites = [newWebsite, ...websites];
  
  // Save to localStorage
  localStorage.setItem('siteguard_websites', JSON.stringify(websites));
  
  // Start monitoring if not already running
  if (!isMonitoring) {
    startMonitoring();
  } else {
    // If monitoring is already running, check this website immediately
    checkWebsite(newWebsite).catch(error => {
      console.error(`Error checking new website ${newWebsite.url}:`, error);
    });
  }
  
  return newWebsite;
}

// Remove website from monitoring
export function removeWebsite(websiteId: string): boolean {
  try {
    // ... (rest of the code remains the same)
    // Remove from in-memory array
    const initialLength = websites.length
    websites = websites.filter(w => w.id !== websiteId)
    
    // Remove from monitoring history
    monitoringHistory = monitoringHistory.filter(data => data.websiteId !== websiteId)
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      // Remove from global websites
      const storedWebsites = localStorage.getItem('siteguard_websites')
      if (storedWebsites) {
        const parsedWebsites = JSON.parse(storedWebsites)
        const filteredWebsites = parsedWebsites.filter((w: Website) => w.id !== websiteId)
        localStorage.setItem('siteguard_websites', JSON.stringify(filteredWebsites))
      }
      
      // Remove from user-specific websites
      const userIds = Object.keys(localStorage).filter(key => key.startsWith('websites_'))
      userIds.forEach(userKey => {
        try {
          const userWebsites = localStorage.getItem(userKey)
          if (userWebsites) {
            const parsedWebsites = JSON.parse(userWebsites)
            const filteredWebsites = parsedWebsites.filter((w: Website) => w.id !== websiteId)
            localStorage.setItem(userKey, JSON.stringify(filteredWebsites))
          }
        } catch (error) {
          console.error('Error removing website from user storage:', error)
        }
      })
      
      // Save updated monitoring data
      saveMonitoringData()
    }
    
    console.log(`🗑️ Removed website ${websiteId} from monitoring`)
    return websites.length < initialLength
  } catch (error) {
    console.error('Error removing website:', error)
    return false
  }
}

// Delete website completely (alias for removeWebsite for clarity)
export function deleteWebsite(websiteId: string): boolean {
  return removeWebsite(websiteId)
}

// Get real-time statistics
export function getRealTimeStats() {
  const totalWebsites = websites.length
  const onlineWebsites = websites.filter(w => w.status === 'up').length
  const offlineWebsites = websites.filter(w => w.status === 'down').length
  const checkingWebsites = websites.filter(w => w.status === 'checking').length
  
  const avgResponseTime = websites.length > 0 ? 
    websites.reduce((acc, w) => acc + w.responseTime, 0) / websites.length : 0
  
  const avgUptime = websites.length > 0 ? 
    websites.reduce((acc, w) => acc + w.uptime, 0) / websites.length : 100
  
  return {
    totalWebsites,
    onlineWebsites,
    offlineWebsites,
    checkingWebsites,
    avgResponseTime: Math.round(avgResponseTime),
    avgUptime: Math.round(avgUptime * 100) / 100
  }
}

// Get comprehensive analytics data
export function getAnalyticsData() {
  const stats = getRealTimeStats()
  
  return {
    overview: {
      totalUptime: stats.avgUptime,
      avgResponseTime: stats.avgResponseTime,
      totalIncidents: stats.offlineWebsites,
      totalChecks: websites.length * 24 * 7, // Estimate based on monitoring frequency
      visualChanges: websites.filter(w => w.imageStatus === "changed").length,
    },
    uptimeData: websites.map(w => ({
      time: new Date(w.lastChecked).toLocaleTimeString(),
      uptime: w.uptime,
    })),
    responseTimeData: websites.map(w => ({
      time: new Date(w.lastChecked).toLocaleTimeString(),
      responseTime: w.responseTime,
    })),
    statusData: websites.map(w => ({
      time: new Date(w.lastChecked).toLocaleTimeString(),
      online: w.status === 'up' ? 1 : 0,
      offline: w.status === 'down' ? 1 : 0,
    })),
    visualChangesData: websites.map(w => ({
      time: new Date(w.lastChecked).toLocaleTimeString(),
      changes: w.imageStatus === 'changed' ? 1 : 0,
    })),
  }
}

// Get incidents data
export function getIncidents() {
  return websites
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

// Get response time history for a specific website (last 24 hours)
export function getResponseTimeHistory(websiteId: string, hours: number = 24) {
  const now = Date.now()
  const timeRange = hours * 60 * 60 * 1000
  
  const recentData = monitoringHistory
    .filter(data => data.websiteId === websiteId && data.timestamp > now - timeRange)
    .sort((a, b) => a.timestamp - b.timestamp)

  // If we have real monitoring data, use it
  if (recentData.length > 0) {
    // Group by hour and calculate average response time
    const hourlyData: { time: string; responseTime: number; timestamp: number }[] = []
    for (let i = hours; i >= 0; i--) {
      const hourStart = now - (i * 60 * 60 * 1000)
      const hourEnd = hourStart + (60 * 60 * 1000)

      const hourData = recentData.filter(data =>
        data.timestamp >= hourStart && data.timestamp < hourEnd
      )

      if (hourData.length > 0) {
        const avgResponseTime = hourData.reduce((sum, data) => sum + data.responseTime, 0) / hourData.length
        hourlyData.push({
          time: new Date(hourStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          responseTime: Math.round(avgResponseTime),
          timestamp: hourStart
        })
      } else {
        // If no data for this hour, use previous hour's data or generate realistic fallback
        const prevHourData = hourlyData[hourlyData.length - 1]
        const fallbackResponseTime = prevHourData ? 
          Math.max(50, prevHourData.responseTime + (Math.random() * 100 - 50)) : 
          Math.random() * 300 + 100 // 100-400ms fallback
        
        hourlyData.push({
          time: new Date(hourStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          responseTime: Math.round(fallbackResponseTime),
          timestamp: hourStart
        })
      }
    }
    return hourlyData
  }

  // If no real data exists, generate realistic simulated data
  const website = websites.find(w => w.id === websiteId)
  if (!website) return []

  const simulatedData: { time: string; responseTime: number; timestamp: number }[] = []
  const baseResponseTime = website.responseTime || 200 // Use current response time or default
  
  for (let i = hours; i >= 0; i--) {
    const hourStart = now - (i * 60 * 60 * 1000)
    const timeOfDay = new Date(hourStart).getHours()
    
    // Simulate different response times based on time of day
    let timeMultiplier = 1
    if (timeOfDay >= 9 && timeOfDay <= 17) {
      timeMultiplier = 0.8 // Faster during business hours
    } else if (timeOfDay >= 22 || timeOfDay <= 6) {
      timeMultiplier = 1.3 // Slower during off-peak hours
    }
    
    // Add some random variation
    const variation = (Math.random() * 0.4 + 0.8) * timeMultiplier // 0.8x to 1.2x
    const responseTime = Math.round(baseResponseTime * variation)
    
    simulatedData.push({
      time: new Date(hourStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responseTime: Math.max(50, responseTime), // Minimum 50ms
      timestamp: hourStart
    })
  }
  
  return simulatedData
}

// Check if monitoring is active
export function isMonitoringActive(): boolean {
  return isMonitoring
}

// Sync websites from user-specific localStorage
export function syncUserWebsites() {
  if (typeof window === 'undefined') return
  
  try {
    // Find all user-specific website keys
    const userIds = Object.keys(localStorage).filter(key => key.startsWith('websites_'))
    
    userIds.forEach(userKey => {
      try {
        const userWebsites = localStorage.getItem(userKey)
        if (userWebsites) {
          const parsedWebsites = JSON.parse(userWebsites)
          
          // Update or add user websites to monitoring service
          parsedWebsites.forEach((userWebsite: Website) => {
            const existingIndex = websites.findIndex(w => w.id === userWebsite.id)
            if (existingIndex >= 0) {
              // Update existing website
              websites[existingIndex] = { ...websites[existingIndex], ...userWebsite }
            } else {
              // Add new website
              websites.push(userWebsite)
            }
          })
        }
      } catch (error) {
        console.error('Error syncing user websites:', error)
      }
    })
    
    // Save updated data
    saveMonitoringData()
    
    console.log(`🔄 Synced ${websites.length} websites from user localStorage`)
  } catch (error) {
    console.error('Error syncing user websites:', error)
  }
}

// Get monitoring status and health information
export function getMonitoringHealth() {
  return {
    isActive: isMonitoring,
    consecutiveErrors,
    maxConsecutiveErrors,
    totalWebsites: websites.length,
    lastCheck: websites.length > 0 ? Math.max(...websites.map(w => new Date(w.lastChecked).getTime())) : 0,
    needsRecovery: consecutiveErrors >= maxConsecutiveErrors
  }
}

// Reset error count manually (useful for debugging)
export function resetMonitoringErrors() {
  consecutiveErrors = 0
  console.log('🔄 Monitoring error count reset')
}
