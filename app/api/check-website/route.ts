import { NextResponse } from 'next/server';

// List of status codes that should be considered as 'up'
const SUCCESS_STATUS_CODES = [
  200, 201, 202, 203, 204, 205, 206, // Success
  300, 301, 302, 303, 304, 307, 308,  // Redirects
  401, 403,  // Authentication required but site is reachable
];

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = 10000; // 10 seconds
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const startTime = Date.now();
    
    try {
      // Normalize URL
      let targetUrl = url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `https://${targetUrl}`;
      }

      // First try with HEAD request (faster, but not all servers support it)
      let response;
      try {
        response = await fetch(targetUrl, {
          method: 'HEAD',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SiteGuard-Pro-Monitor/1.0; +https://yoursite.com/monitoring)',
          },
        });
      } catch (error) {
        // If HEAD fails, try with GET
        console.log(`HEAD request failed, trying GET for ${targetUrl}`);
        response = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SiteGuard-Pro-Monitor/1.0; +https://yoursite.com/monitoring)',
          },
        });
      }

      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const isUp = SUCCESS_STATUS_CODES.includes(response.status);
      
      return NextResponse.json({
        success: isUp,
        statusCode: response.status,
        statusText: response.statusText,
        responseTime,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${url}`);
        return NextResponse.json(
          { 
            success: false, 
            statusCode: 408, 
            statusText: 'Request Timeout',
            responseTime: timeout,
            timestamp: new Date().toISOString()
          },
          { status: 200 }
        );
      }
      
      console.error(`Error checking ${url}:`, error);
      return NextResponse.json(
        { 
          success: false, 
          statusCode: 500, 
          statusText: error.message || 'Error checking website',
          responseTime: 0,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }
    
  } catch (error) {
    console.error('Error in check-website endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        statusCode: 500, 
        statusText: 'Internal Server Error',
        responseTime: 0,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  }
}
