# AI Agent Instructions - OME Dashboard SCTE-35 Implementation

## Project Overview
This document contains comprehensive instructions for AI agents working on the OvenMediaEngine (OME) Dashboard SCTE-35 implementation project. It includes chat summaries, progress tracking, technical specifications, and troubleshooting guides.

## Current Project Status

### ✅ Completed Tasks
1. **SCTE-35 Manager Implementation** - Full SCTE-35 compliance management system
2. **Global SCTE-35 Toggle** - Dashboard-wide SCTE-35 injection control
3. **OME API Integration** - Complete API service for OME communication
4. **Stream Preview Player** - Embedded player in Applications tab with stream status
5. **OME Server Configuration** - Proper Server.xml setup with authentication
6. **Nginx Reverse Proxy** - CORS handling for LLHLS streams
7. **TypeScript Error Fixes** - All linter errors resolved
8. **Authentication Setup** - Basic Auth with token "ovenmediaengine"
9. **Channel Management Scheduler** - OME Scheduled Provider configuration
10. **Schedule Files Creation** - Sample channel schedules with mixed content
11. **Media Files Generation** - Sample MP4 files for scheduled content
12. **External Stream Integration** - FFmpeg relay for external HLS streams
13. **Failover System Design** - Live stream failover to local files
14. **Advanced Schedule Management Interface** - Complete UI for channel scheduling with program management
15. **Real-time Schedule Updates** - Dynamic scheduling system with emergency content insertion
16. **SCTE-35 Schedule Integration** - Automated SCTE-35 injection during scheduled programs
17. **Failover Monitoring Service** - Automated stream health monitoring and failover switching
18. **New Services Implementation** - scheduleUpdateService, scte35ScheduleService, failoverService
19. **Enhanced Component Architecture** - Organized component structure with proper separation of concerns
20. **Comprehensive Documentation** - Updated implementation guides and project status

### 🔄 In Progress
- **URL Format Issues** - Fixing OME Scheduled Provider URL constraints (file:// and stream:// only)
- **External HLS Integration** - FFmpeg relay setup for external streams
- **API Authentication** - Resolving 401 errors after FFmpeg relay start

### ⏳ Pending Tasks
- **Performance Optimization** - Queue management improvements
- **External HLS Integration Testing** - Verify FFmpeg relay functionality
- **Scheduled Channels Testing** - Test live stream failover with scheduled content
- **Production Deployment** - Deploy to production environment
- **User Documentation** - Create user guides and tutorials

## Technical Architecture

### Core Components
```
/home/ubuntu/dashboardome/
├── src/
│   ├── components/
│   │   ├── compliance/scte35/
│   │   │   ├── SCTE35Manager.tsx                  # Main SCTE-35 management
│   │   │   └── SCTE35ScheduleIntegration.tsx      # SCTE-35 with scheduled content
│   │   ├── management/
│   │   │   ├── vhosts/VHostManagement.tsx         # Stream preview player with status
│   │   │   └── channels/
│   │   │       ├── ChannelScheduler.tsx           # Channel schedule management
│   │   │       └── RealtimeScheduleUpdates.tsx    # Real-time schedule updates
│   │   ├── monitoring/FailoverMonitor.tsx         # Failover monitoring dashboard
│   │   └── core/layout/Dashboard.tsx              # Global SCTE-35 toggle
│   ├── services/
│   │   ├── omeApi.ts                              # OME API integration
│   │   ├── failoverService.ts                     # Failover monitoring service
│   │   ├── scheduleUpdateService.ts               # Real-time schedule updates
│   │   └── scte35ScheduleService.ts               # SCTE-35 schedule integration
│   └── stores/useOMEStore.ts                      # State management
├── OvenMediaEngine/conf/Server.xml                # OME configuration with Scheduled Provider
├── schedules/                                     # Channel schedule files (.sch)
│   ├── channel1.sch                              # Mixed content channel
│   ├── channel2.sch                              # Music channel with live priority
│   └── channel3.sch                              # External HLS integration
├── media/                                        # Local media files for scheduling
│   ├── fallback.mp4                              # Fallback content
│   ├── morning_content.mp4                       # Morning show content
│   └── music_playlist.mp4                        # Music playlist
└── nginx.conf                                     # Reverse proxy config
```

### Key Technologies
- **Frontend**: React.js, TypeScript, Ant Design, Zustand
- **Backend**: OvenMediaEngine (OME) v8
- **Streaming**: RTMP, LLHLS, WebRTC, SRT, HLS
- **Authentication**: Basic Auth (Base64)
- **Proxy**: Nginx for CORS handling
- **Scheduling**: OME Scheduled Provider with XML schedule files
- **Media Processing**: FFmpeg for stream relay and media generation
- **Failover**: Automated live stream failover to local media files

## Channel Management Scheduler Implementation

### OME Scheduled Provider Configuration
The OME Scheduled Provider enables automated channel management with mixed content, live stream failover, and dynamic scheduling.

#### Server.xml Configuration
```xml
<Applications>
  <Application>
    <Name>live</Name>
    <Type>live</Type>
    <Providers>
      <RTMP><Port>1935</Port></RTMP>
      <Schedule>
        <MediaRootDir>/home/ubuntu/dashboardome/media</MediaRootDir>
        <ScheduleFilesDir>/home/ubuntu/dashboardome/schedules</ScheduleFilesDir>
      </Schedule>
    </Providers>
  </Application>
</Applications>
```

#### Schedule File Format (.sch)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Schedule>
  <Stream>
    <Name>channel1</Name>
    <BypassTranscoder>false</BypassTranscoder>
    <VideoTrack>true</VideoTrack>
    <AudioTrack>true</AudioTrack>
  </Stream>
  <FallbackProgram>
    <Item url="file://fallback.mp4" start="0" duration="600000" />
  </FallbackProgram>
  <Program name="morning_show" scheduled="2025-10-15T06:00:00.000+00:00" repeat="true">
    <Item url="stream://default/live/live" duration="21600000" />
    <Item url="file://morning_content.mp4" start="0" duration="21600000" />
  </Program>
</Schedule>
```

### Supported URL Formats
- **file://** - Local media files (MP4, etc.)
- **stream://** - Live streams from OME applications
- **External HLS** - Relayed via FFmpeg to RTMP, then referenced as stream://

### Failover System
- **Primary**: Live streams (RTMP, HLS, SRT)
- **Fallback**: Local media files when live source fails
- **Auto-switch**: Automatic return to live when source resumes

### FFmpeg Relay for External Streams
```bash
# Relay external HLS to OME RTMP
ffmpeg -i https://cdn.itassist.one/jd/mqtv/index.m3u8 \
       -c copy -f flv rtmp://192.168.1.102:1935/live/external_hls &

# Then reference in schedule as:
# <Item url="stream://default/live/external_hls" duration="7200000" />
```

## SCTE-35 Implementation Details

### SCTE-35 Manager Features
- **Global Toggle**: Enable/disable SCTE-35 injection across all streams
- **Event Management**: Create, schedule, and inject SCTE-35 cues
- **Stream Monitoring**: Real-time stream status and statistics
- **Compliance Tracking**: Event history and audit logs

### API Endpoints Used
```typescript
// OME API Base URL
const API_BASE = 'http://192.168.1.102:8081/v1'

// Key endpoints
GET /vhosts                           // List virtual hosts
GET /vhosts/{vhost}/apps              // List applications
GET /vhosts/{vhost}/apps/{app}/streams // List streams
POST /vhosts/{vhost}/apps/{app}/streams/{stream}/sendEvent // Inject SCTE-35
```

### SCTE-35 Event Format
```typescript
interface SCTE35Event {
  id: number;
  type: 'out' | 'in';
  duration?: number; // milliseconds, only for 'out' type
  autoReturn?: boolean;
}

// OME API payload format
const eventData = {
  eventFormat: 'scte35',
  events: [{
    spliceCommand: 'spliceInsert',
    id: scte35Data.id,
    type: sCTE35Data.type,
    duration: scte35Data.duration || 0,
    autoReturn: scte35Data.autoReturn || false
  }]
};
```

## OME Server Configuration

### Server.xml Key Settings
```xml
<Server version="8">
  <Name>OvenMediaEngine</Name>
  <Type>origin</Type>
  <IP>*</IP>
  
  <Modules>
    <LLHLS><Enable>true</Enable></LLHLS>
    <HTTP2><Enable>true</Enable></HTTP2>
  </Modules>
  
  <Bind>
    <Managers>
      <API>
        <Port>8081</Port>
        <AccessToken>ovenmediaengine</AccessToken>
      </API>
    </Managers>
    
    <Providers>
      <RTMP><Port>1935</Port></RTMP>
      <SRT><Port>9999</Port></SRT>
    </Providers>
    
    <Publishers>
      <LLHLS><Port>3334</Port></LLHLS>
    </Publishers>
  </Bind>
</Server>
```

### Authentication
- **Method**: Basic Authentication
- **Token**: `ovenmediaengine`
- **Format**: `Authorization: Basic b3Zlbm1lZGlhZW5naW5lOg==`

## Streaming Configuration

### OBS Studio Settings
```
Service: Custom
Server: rtmp://192.168.1.102:1935/live
Stream Key: live

Encoder: x264
Rate Control: CBR
Bitrate: 2500 kbps
Keyframe Interval: 2 seconds
CPU Usage Preset: veryfast
```

### Stream URLs
- **RTMP Ingest**: `rtmp://192.168.1.102:1935/live/live`
- **LLHLS Direct**: `http://192.168.1.102:3334/live/live/llhls.m3u8`
- **LLHLS Proxy**: `http://192.168.1.102:5179/live/live/llhls.m3u8`

### FFmpeg Test Command
```bash
ffmpeg -f lavfi -i testsrc2=size=1920x1080:rate=30 \
       -f lavfi -i sine=frequency=1000 \
       -c:v libx264 -preset veryfast -b:v 2500k \
       -c:a aac -b:a 128k \
       -f flv rtmp://192.168.1.102:1935/live/live
```

## Nginx Configuration

### Reverse Proxy Setup
```nginx
server {
    listen 5179;
    server_name _;
    
    location / {
        proxy_pass http://192.168.1.102:3334;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        
        # Cache control
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

## Current Session Progress (October 16, 2025)

### Recent Achievements
1. **Channel Scheduler Implementation**: Successfully configured OME Scheduled Provider
2. **Schedule Files Created**: Three sample channels with mixed content and failover
3. **Media Files Generated**: Sample MP4 files for scheduled content using FFmpeg
4. **External Stream Integration**: Started FFmpeg relay for external HLS stream
5. **Stream Status Enhancement**: Added real-time stream status to preview player
6. **Advanced Schedule Management Interface**: Complete UI for channel scheduling with program management
7. **Real-time Schedule Updates**: Dynamic scheduling system with emergency content insertion
8. **SCTE-35 Schedule Integration**: Automated SCTE-35 injection during scheduled programs
9. **Failover Monitoring Service**: Automated stream health monitoring and failover switching
10. **New Services Implementation**: scheduleUpdateService, scte35ScheduleService, failoverService
11. **Enhanced Component Architecture**: Organized component structure with proper separation of concerns
12. **GitHub Repository Update**: All changes pushed to https://github.com/shihan84/dashboardome.git

### Current Issues
1. **API Authentication Error**: 401 Unauthorized after starting FFmpeg relay
2. **URL Format Constraints**: OME Scheduled Provider only supports file:// and stream:// URLs
3. **External HLS Integration**: Need to verify FFmpeg relay is working properly

### Immediate Next Steps
1. Fix API authentication issue
2. Verify external_hls stream is being published to OME
3. Test scheduled channels with live stream failover
4. Build advanced schedule management interface

### Background Processes Running
- OME Server: `./OvenMediaEngine/src/bin/RELEASE/OvenMediaEngine -c /home/ubuntu/dashboardome/OvenMediaEngine/conf`
- Dashboard: `npm run dev -- --host 192.168.1.102 --port 5173`
- FFmpeg Relay: `ffmpeg -i https://cdn.itassist.one/jd/mqtv/index.m3u8 -c copy -f flv rtmp://192.168.1.102:1935/live/external_hls`

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. "Server Disconnected" Error
**Symptoms**: Dashboard shows server disconnected
**Causes**: 
- OME server not running
- Authentication issues
- Network connectivity problems

**Solutions**:
```bash
# Check if OME is running
ps aux | grep OvenMediaEngine

# Start OME server
cd /home/ubuntu/dashboardome
nohup ./OvenMediaEngine/src/bin/RELEASE/OvenMediaEngine -c /home/ubuntu/dashboardome/OvenMediaEngine/conf > ome.log 2>&1 &

# Check logs
tail -f ome.log
```

#### 2. "Initializing HLS" Error
**Symptoms**: Preview player shows HLS initialization error
**Causes**:
- No active stream
- CORS issues
- Incorrect stream URL

**Solutions**:
- Verify stream is active: `curl -I http://192.168.1.102:3334/live/live/llhls.m3u8`
- Use Nginx proxy URL: `http://192.168.1.102:5179/live/live/llhls.m3u8`
- Check OBS connection and stream key

#### 3. API Authentication Errors
**Symptoms**: 401 Unauthorized responses
**Causes**:
- Incorrect credentials
- Missing Authorization header

**Solutions**:
```bash
# Test with correct Basic Auth
curl -H "Authorization: Basic b3Zlbm1lZGlhZW5naW5lOg==" \
     http://192.168.1.102:8081/v1/vhosts/default/apps/live/streams
```

#### 4. Port Conflicts
**Symptoms**: OME fails to start with "Address already in use"
**Solutions**:
```bash
# Kill existing processes
pkill -f OvenMediaEngine
pkill -f nginx

# Check port usage
ss -tlnp | grep -E "(1935|3334|8081|5179)"
```

#### 5. Scheduled Provider URL Format Errors
**Symptoms**: "Failed to parse url attribute, url must be file:// or stream://"
**Causes**:
- Using HTTPS URLs directly in schedule files
- OME Scheduled Provider only supports file:// and stream:// formats

**Solutions**:
```bash
# For external HLS streams, use FFmpeg relay:
ffmpeg -i https://external-stream.com/playlist.m3u8 \
       -c copy -f flv rtmp://192.168.1.102:1935/live/stream_name &

# Then reference in schedule as:
# <Item url="stream://default/live/stream_name" duration="7200000" />
```

#### 6. API Authentication After FFmpeg Start
**Symptoms**: 401 Unauthorized errors after starting FFmpeg relay
**Causes**:
- OME server restart required after configuration changes
- Authentication token issues

**Solutions**:
```bash
# Restart OME server
pkill -f OvenMediaEngine
cd /home/ubuntu/dashboardome
nohup ./OvenMediaEngine/src/bin/RELEASE/OvenMediaEngine -c /home/ubuntu/dashboardome/OvenMediaEngine/conf > ome.log 2>&1 &

# Test authentication
curl -H "Authorization: Basic b3Zlbm1lZGlhZW5naW5lOg==" \
     http://192.168.1.102:8081/v1/vhosts
```

## Development Commands

### Starting Services
```bash
# Start OME server
cd /home/ubuntu/dashboardome
nohup ./OvenMediaEngine/src/bin/RELEASE/OvenMediaEngine -c /home/ubuntu/dashboardome/OvenMediaEngine/conf > ome.log 2>&1 &

# Start Nginx proxy
sudo nginx -c /home/ubuntu/dashboardome/nginx.conf

# Start dashboard
cd /home/ubuntu/dashboardome
npm run dev -- --host 192.168.1.102 --port 5173
```

### Testing Commands
```bash
# Test OME API
curl -H "Authorization: Basic b3Zlbm1lZGlhZW5naW5lOg==" \
     http://192.168.1.102:8081/v1/vhosts

# Test stream endpoints
curl -I http://192.168.1.102:3334/live/live/llhls.m3u8
curl -I http://192.168.1.102:5179/live/live/llhls.m3u8

# Check service status
ps aux | grep -E "(OvenMediaEngine|nginx|npm)"
```

## File Locations

### Configuration Files
- **OME Config**: `/home/ubuntu/dashboardome/OvenMediaEngine/conf/Server.xml`
- **Nginx Config**: `/home/ubuntu/dashboardome/nginx.conf`
- **Package Config**: `/home/ubuntu/dashboardome/package.json`

### Source Code
- **SCTE-35 Manager**: `/home/ubuntu/dashboardome/src/components/compliance/scte35/SCTE35Manager.tsx`
- **VHost Management**: `/home/ubuntu/dashboardome/src/components/management/vhosts/VHostManagement.tsx`
- **Channel Scheduler**: `/home/ubuntu/dashboardome/src/components/management/channels/ChannelScheduler.tsx`
- **Failover Monitor**: `/home/ubuntu/dashboardome/src/components/monitoring/FailoverMonitor.tsx`
- **OME API Service**: `/home/ubuntu/dashboardome/src/services/omeApi.ts`
- **Failover Service**: `/home/ubuntu/dashboardome/src/services/failoverService.ts`
- **Dashboard Layout**: `/home/ubuntu/dashboardome/src/components/core/layout/Dashboard.tsx`

### Schedule and Media Files
- **Schedule Files**: `/home/ubuntu/dashboardome/schedules/`
  - `channel1.sch` - Mixed content channel
  - `channel2.sch` - Music channel with live priority
  - `channel3.sch` - External HLS integration
- **Media Files**: `/home/ubuntu/dashboardome/media/`
  - `fallback.mp4` - Fallback content
  - `morning_content.mp4` - Morning show content
  - `music_playlist.mp4` - Music playlist

### Logs and Data
- **OME Logs**: `/home/ubuntu/dashboardome/ome.log`
- **Nginx Logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`

## Network Configuration

### IP Addresses and Ports
- **Server IP**: 192.168.1.102
- **Dashboard**: 5173 (HTTP)
- **OME API**: 8081 (HTTP), 8082 (HTTPS)
- **RTMP**: 1935
- **LLHLS**: 3334 (HTTP), 3335 (HTTPS)
- **SRT**: 9999
- **Nginx Proxy**: 5179

### Firewall Rules
```bash
# Allow required ports
sudo ufw allow 1935/tcp  # RTMP
sudo ufw allow 3334/tcp  # LLHLS
sudo ufw allow 8081/tcp  # OME API
sudo ufw allow 5173/tcp  # Dashboard
sudo ufw allow 5179/tcp  # Nginx Proxy
```

## New Implementations (October 16, 2025)

### Advanced Schedule Management Interface
- **Component**: `src/components/management/channels/ChannelScheduler.tsx`
- **Features**: Complete UI for channel scheduling with program management
- **Capabilities**: Create, edit, delete channels and programs with visual timeline
- **Status**: ✅ **COMPLETED**

### Real-time Schedule Updates
- **Service**: `src/services/scheduleUpdateService.ts`
- **Component**: `src/components/management/channels/RealtimeScheduleUpdates.tsx`
- **Features**: Dynamic scheduling system with emergency content insertion
- **Capabilities**: Live schedule modifications, emergency content queue, real-time processing
- **Status**: ✅ **COMPLETED**

### SCTE-35 Schedule Integration
- **Service**: `src/services/scte35ScheduleService.ts`
- **Component**: `src/components/compliance/scte35/SCTE35ScheduleIntegration.tsx`
- **Features**: Automated SCTE-35 injection during scheduled programs
- **Capabilities**: Program-based SCTE-35 scheduling, emergency injection, event tracking
- **Status**: ✅ **COMPLETED**

### Failover Monitoring Service
- **Service**: `src/services/failoverService.ts`
- **Component**: `src/components/monitoring/FailoverMonitor.tsx`
- **Features**: Automated stream health monitoring and failover switching
- **Capabilities**: Health checks, automatic failover, recovery monitoring, event logging
- **Status**: ✅ **COMPLETED**

## Future Enhancements

### Planned Features
1. **WebRTC Support** - Low-latency streaming
2. **Recording/DVR** - Stream recording capabilities
3. **Multi-bitrate Streaming** - Adaptive bitrate streaming
4. **Analytics Dashboard** - Stream statistics and monitoring
5. **User Management** - Multi-user access control

### Performance Optimizations
1. **Queue Management** - Fix OME queue overflow issues
2. **Caching Strategy** - Implement proper cache headers
3. **Load Balancing** - Multiple OME instances
4. **CDN Integration** - Edge server distribution

## Contact and Support

### Documentation References
- **OME Documentation**: https://airensoft.gitbook.io/ovenmediaengine/
- **SCTE-35 Standard**: https://www.scte.org/standards/scte-35-2021
- **React Documentation**: https://reactjs.org/docs
- **Ant Design**: https://ant.design/docs/react/introduce

### Key Commands for New Sessions
```bash
# Quick status check
ps aux | grep -E "(OvenMediaEngine|nginx|npm)" | grep -v grep

# Start all services
cd /home/ubuntu/dashboardome && nohup ./OvenMediaEngine/src/bin/RELEASE/OvenMediaEngine -c /home/ubuntu/dashboardome/OvenMediaEngine/conf > ome.log 2>&1 & && sudo nginx -c /home/ubuntu/dashboardome/nginx.conf && npm run dev -- --host 192.168.1.102 --port 5173

# Test stream
curl -I http://192.168.1.102:5179/live/live/llhls.m3u8
```

---

**Last Updated**: October 16, 2025
**Project Status**: ✅ **MAJOR MILESTONE ACHIEVED** - All Pending Implementations Completed
**Next Milestone**: Production Deployment and User Documentation
**Current Focus**: Testing and optimization of new implementations
**GitHub Repository**: https://github.com/shihan84/dashboardome.git
**Deployment Status**: All changes pushed to GitHub successfully