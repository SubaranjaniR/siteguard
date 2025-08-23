# 🚨 Alert Rules System - Real-Time Monitoring Guide

## Overview
The Alert Rules system provides real-time monitoring and automated notifications for your websites. It continuously checks your websites against defined rules and triggers alerts when conditions are met.

## 🔧 How Alert Rules Work in Real-Time

### 1. **Real-Time Monitoring Cycle**
- **Check Interval**: Every 30 seconds, the system automatically checks all enabled alert rules
- **Data Source**: Uses actual website monitoring data from localStorage (same as dashboard)
- **Integration**: Directly connected to your website monitoring system

### 2. **Alert Rule Types**

#### **🛑 Downtime Alerts**
- **Trigger**: When website status changes to "down"
- **Severity**: Critical (Red)
- **Example**: "Google is currently down"
- **Real-time**: Monitors actual website status from monitoring system

#### **⏱️ Response Time Alerts**
- **Trigger**: When response time exceeds your threshold
- **Severity**: Warning (Yellow)
- **Example**: "Google response time (2500ms) exceeds threshold (2000ms)"
- **Real-time**: Uses actual response time data from monitoring

#### **🔒 SSL Certificate Alerts**
- **Trigger**: When SSL certificate expires within specified days
- **Severity**: Warning (Yellow)
- **Example**: "Google SSL certificate expires in 25 days"
- **Real-time**: Simulates SSL expiry checks (in real implementation, would check actual certificates)

#### **🖼️ Visual Change Alerts**
- **Trigger**: When visual changes are detected on monitored pages
- **Severity**: Warning (Yellow)
- **Example**: "Visual changes detected on Google"
- **Real-time**: Uses actual image monitoring data from your uploaded reference images

### 3. **Real-Time Alert Processing**

```javascript
// Every 30 seconds, the system runs this check:
const checkAlertRules = () => {
  alertRules.forEach(rule => {
    if (!rule.enabled) return
    
    const website = websites.find(w => w.id === rule.websiteId)
    if (!website) return
    
    // Check specific conditions based on rule type
    switch (rule.type) {
      case "downtime":
        if (website.status === "down") {
          // Trigger alert immediately
        }
        break
      case "response_time":
        if (website.responseTime > threshold) {
          // Trigger alert immediately
        }
        break
      case "visual_change":
        if (website.imageStatus === "changed") {
          // Trigger alert immediately
        }
        break
    }
  })
}
```

### 4. **Alert Lifecycle**

#### **Active Alert**
- **Status**: "Active" (Red badge)
- **Action**: Requires acknowledgment or resolution
- **Real-time**: Shows immediately when condition is met

#### **Acknowledged Alert**
- **Status**: "Acknowledged" (Blue badge)
- **Action**: User has seen the alert but issue may still exist
- **Real-time**: Updates status instantly when acknowledged

#### **Resolved Alert**
- **Status**: "Resolved" (Green badge)
- **Action**: Issue has been resolved
- **Real-time**: Updates status when manually resolved

### 5. **Notification Methods**

#### **📧 Email Notifications**
- **Real-time**: Sends immediately when alert triggers
- **Content**: Detailed alert information with website details
- **Integration**: Uses your profile email address

#### **📱 SMS Notifications**
- **Real-time**: Sends immediately when alert triggers
- **Content**: Brief alert message with website name
- **Integration**: Uses your profile phone number

#### **🔔 Push Notifications**
- **Real-time**: Shows browser notification immediately
- **Content**: Alert summary with action buttons
- **Integration**: Browser-based notifications

### 6. **Data Persistence**

#### **Alert Rules Storage**
```javascript
// Saved to localStorage per user
localStorage.setItem(`alertRules_${userId}`, JSON.stringify(rules))
```

#### **Recent Alerts Storage**
```javascript
// Keeps last 50 alerts
localStorage.setItem(`recentAlerts_${userId}`, JSON.stringify(alerts))
```

#### **Real-time Updates**
- Rules are saved immediately when created/modified
- Alerts are saved immediately when triggered
- All data persists across browser sessions

### 7. **Integration with Monitoring System**

#### **Dashboard Integration**
- Visual Changes card shows count of detected changes
- Real-time status updates from monitoring system
- Immediate reflection of alert triggers

#### **Analytics Integration**
- Alert data feeds into analytics graphs
- Real-time incident tracking
- Historical alert patterns

#### **Settings Integration**
- User profile data used for notifications
- Notification preferences saved per user
- Email/phone from profile used for alerts

### 8. **Real-Time Features**

#### **Instant Triggering**
- Alerts trigger within 30 seconds of condition detection
- No manual refresh required
- Real-time status updates

#### **Live Data**
- Uses actual monitoring data, not mock data
- Reflects real website status changes
- Integrates with visual change detection

#### **Persistent State**
- Alert rules persist across sessions
- Alert history maintained
- User preferences saved

### 9. **Alert Rule Management**

#### **Creating Rules**
1. Click "Add Alert Rule"
2. Select website from your monitored sites
3. Choose alert type
4. Set threshold/conditions
5. Configure notifications
6. Add recipients
7. Save rule

#### **Managing Rules**
- Enable/disable rules with toggle switch
- Edit existing rules
- Delete rules
- View trigger history

#### **Alert Actions**
- Acknowledge active alerts
- Resolve alerts when issues fixed
- View alert details
- Track alert history

### 10. **Example Real-Time Workflow**

1. **User creates alert rule**: "Notify me when Google response time > 2000ms"
2. **System monitors**: Every 30 seconds, checks Google's actual response time
3. **Condition met**: Google response time becomes 2500ms
4. **Alert triggered**: Immediate notification sent via email/SMS
5. **Alert appears**: Shows in Recent Alerts with "Active" status
6. **User acknowledges**: Clicks acknowledge button
7. **Status updates**: Alert becomes "Acknowledged"
8. **Issue resolved**: Google response time returns to 1500ms
9. **User resolves**: Clicks resolve button
10. **Alert closed**: Status becomes "Resolved"

## 🎯 Key Benefits

- **Real-time monitoring**: No delays in alert detection
- **Multiple notification methods**: Email, SMS, Push notifications
- **Persistent data**: Rules and alerts saved across sessions
- **Integration**: Works with actual monitoring data
- **Visual change detection**: Monitors website appearance changes
- **Flexible thresholds**: Customizable conditions for each rule type
- **Alert lifecycle**: Track alert status from active to resolved

This system provides comprehensive, real-time monitoring with immediate alerting capabilities for all your website monitoring needs.
