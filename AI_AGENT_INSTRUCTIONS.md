# AI Agent Instructions: OME Compliance Dashboard

## Project Overview

**Project Name:** OME Compliance Dashboard  
**Repository:** https://github.com/shihan84/dashboardome.git  
**Type:** React-based web dashboard for OvenMediaEngine management  
**Status:** Core features completed, comprehensive OME features implemented  

## Project Purpose

A comprehensive web-based dashboard for managing OvenMediaEngine (OME) servers with a focus on distributor compliance, particularly SCTE-35 ad insertion and stream validation. The dashboard provides full OME server management capabilities including virtual hosts, applications, streams, recording, push publishing, and real-time statistics.

## Technical Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI Framework:** Ant Design
- **State Management:** Zustand with persistence
- **HTTP Client:** Axios
- **Date/Time:** Day.js
- **Development:** Hot Module Replacement (HMR) with Vite
- **Mock Server:** Express.js (Node.js)

## Project Structure

```
ome-compliance-dashboard/
├── src/
│   ├── components/           # React components
│   │   ├── Dashboard.tsx     # Main dashboard layout
│   │   ├── ComplianceInjectionForm.tsx    # SCTE-35 injection
│   │   ├── StreamProfileValidator.tsx   # Stream validation
│   │   ├── SCTE35EventLog.tsx          # Event logging
│   │   ├── SCTE35Scheduler.tsx          # Event scheduling
│   │   ├── ConfigurationGenerator.tsx  # XML config generation
│   │   ├── ConnectionSettings.tsx     # OME connection config
│   │   ├── VHostManagement.tsx       # Virtual host management
│   │   ├── RecordingManagement.tsx    # Recording management
│   │   ├── PushPublishingManagement.tsx # Push publishing
│   │   ├── StatisticsDashboard.tsx    # Statistics display
│   │   └── ErrorBoundary.tsx          # Error handling
│   ├── services/
│   │   └── omeApi.ts         # OME API service
│   ├── store/
│   │   └── useStore.ts       # Zustand state management
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── utils/
│   │   └── scte35.ts         # SCTE-35 utilities
│   └── App.tsx              # Root component
├── mock-ome-server.cjs      # Basic mock server (working)
├── mock-ome-server-comprehensive.cjs # Full mock server (has route issues)
├── README.md                # Project documentation
└── AI_AGENT_INSTRUCTIONS.md # This file
```

## Current Status

### ✅ COMPLETED FEATURES

#### Core Compliance Features
- **SCTE-35 Injection Form:** Smart form with auto-incrementing Event IDs, Ad Duration, Pre-roll support
- **Stream Profile Validator:** Live stream validation against distributor requirements
- **SCTE-35 Event Log:** Timeline visualization and log table with WebSocket support
- **SCTE-35 Scheduler:** Future event scheduling capabilities
- **Configuration Generator:** OME OutputProfile XML generation

#### OME Management Features
- **Virtual Host Management:** Create, delete, list, detailed info
- **Application Management:** Full CRUD operations with detailed configuration
- **Stream Management:** Pull stream creation, monitoring, deletion
- **Recording Management:** Start, stop, status monitoring
- **Push Publishing:** SRT, RTMP, MPEG2-TS to external destinations
- **Statistics Dashboard:** Real-time server, vhost, app, stream metrics

#### Technical Infrastructure
- **TypeScript Support:** Comprehensive type definitions for all OME API entities
- **API Service:** Complete OMEApiService with authentication and all endpoints
- **State Management:** Zustand store with persistence
- **Error Handling:** React Error Boundaries
- **Mock Server:** Express.js server for development/testing
- **Documentation:** Comprehensive README.md

### 🚧 KNOWN ISSUES

#### Mock Server Route Issues
- **File:** `mock-ome-server-comprehensive.cjs`
- **Problem:** Express routes with colon suffixes (e.g., `:startRecord`) cause PathError
- **Affected Routes:** 
  - `/v1/vhosts/:vhost/apps/:app:startRecord`
  - `/v1/vhosts/:vhost/apps/:app:stopRecord`
  - `/v1/vhosts/:vhost/apps/:app:pushes`
- **Solution:** Change colons to slashes: `/v1/vhosts/:vhost/apps/:app/startRecord`
- **Workaround:** Use `mock-ome-server.cjs` (basic version works)

#### Import Resolution (RESOLVED)
- **Issue:** TypeScript interfaces imported as runtime values
- **Solution:** Use `import type` for all interface imports
- **Status:** ✅ Fixed across all components

### 📋 PENDING TASKS

#### High Priority
1. **Fix Mock Server Routes** - Update comprehensive mock server route definitions
2. **Application Management UI** - Complete application CRUD interface
3. **Stream Management UI** - Complete stream management interface
4. **Output Profile Management** - Complete output profile CRUD interface

#### Medium Priority
5. **Scheduled Channels** - Implement pre-recorded content management
6. **Multiplex Channels** - Implement stream duplication features
7. **Thumbnail Generation** - Implement thumbnail management
8. **HLS Dump** - Implement VoD creation functionality

#### Advanced Features
9. **WebRTC Features** - Signaling, TURN server configuration
10. **SRT Features** - Advanced SRT configuration and monitoring
11. **RTMP Features** - RTMP-specific configuration
12. **RTSP Features** - RTSP pull stream configuration
13. **Access Control** - SignedPolicy, AdmissionWebhooks
14. **Clustering** - Origin-Edge clustering features
15. **DRM Features** - Widevine, Fairplay support
16. **Subtitle Management** - WebVTT, ID3v2 support
17. **GPU Acceleration** - GPU configuration and monitoring
18. **ABR Features** - Adaptive Bitrate Streaming
19. **LLHLS Features** - Low-Latency HLS specific features
20. **Monitoring** - Comprehensive monitoring and alerting
21. **Configuration** - Server configuration management
22. **Security** - TLS, authentication features
23. **Performance** - Performance tuning and optimization
24. **Logging** - Logging and debugging features
25. **Webhooks** - AdmissionWebhooks, TranscodeWebhooks

## Development Workflow

### Starting Development
```bash
# Start the dashboard
npm run dev

# Start mock server (basic - works)
node mock-ome-server.cjs

# Start mock server (comprehensive - has route issues)
node mock-ome-server-comprehensive.cjs
```

### Testing
- **Dashboard:** http://localhost:5173/ (or 5174 if 5173 is busy)
- **Mock API:** http://localhost:8081/v1
- **Connection:** Use Connection Settings to configure OME server details

### Key Files to Modify

#### For New Features
1. **Types:** `src/types/index.ts` - Add new interfaces
2. **API Service:** `src/services/omeApi.ts` - Add new API methods
3. **Components:** `src/components/` - Create new React components
4. **Dashboard:** `src/components/Dashboard.tsx` - Integrate new components
5. **Mock Server:** `mock-ome-server-comprehensive.cjs` - Add mock endpoints

#### For Bug Fixes
1. **Route Issues:** Fix Express routes in mock server
2. **Type Issues:** Ensure `import type` for interfaces
3. **Component Issues:** Check ErrorBoundary for React errors

## API Integration

### OME API Endpoints Used
- **Statistics:** `/v1/stats/current`
- **Virtual Hosts:** `/v1/vhosts`
- **Applications:** `/v1/vhosts/{vhost}/apps`
- **Streams:** `/v1/vhosts/{vhost}/apps/{app}/streams`
- **SCTE-35:** `/v1/vhosts/{vhost}/apps/{app}/streams/{stream}/sendEvent`
- **Output Profiles:** `/v1/vhosts/{vhost}/apps/{app}/outputProfiles`
- **Recording:** `/v1/vhosts/{vhost}/apps/{app}:startRecord`
- **Push Publishing:** `/v1/vhosts/{vhost}/apps/{app}:pushes`

### Authentication
- Basic Authentication supported
- Username/password configuration in Connection Settings
- Headers: `Authorization: Basic ${btoa(username:password)}`

## State Management

### Zustand Store Structure
```typescript
interface AppState {
  // SCTE-35 Events
  events: SCTE35Event[];
  lastEventId: number;
  
  // OME Connection
  omeHost: string;
  omePort: number;
  omeUsername: string;
  omePassword: string;
  isConnected: boolean;
  
  // Current Context
  currentStream: OMEStream | null;
  currentVHost: string;
  currentApp: string;
  complianceChecks: ComplianceCheck[];
  
  // WebSocket
  wsConnection: WebSocket | null;
}
```

## Error Handling

### Known Error Patterns
1. **Module Import Errors:** Use `import type` for TypeScript interfaces
2. **Route Errors:** Fix Express route definitions in mock server
3. **React Errors:** Check ErrorBoundary component for component errors
4. **API Errors:** Check OMEApiService for proper error handling

### Debugging Steps
1. Check browser console for JavaScript errors
2. Verify mock server is running on port 8081
3. Check dashboard connection settings
4. Verify API endpoints in mock server
5. Check React component error boundaries

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
- No environment variables currently required
- OME connection configured through UI

### Docker Support
- Dockerfile not yet created
- Can be added for containerized deployment

## Contributing Guidelines

### Code Style
- TypeScript for all new code
- Ant Design components for UI
- Zustand for state management
- Axios for API calls
- Error boundaries for error handling

### Testing
- Use mock server for development
- Test all new features with mock data
- Verify TypeScript compilation
- Check React component rendering

### Documentation
- Update README.md for new features
- Add JSDoc comments for new functions
- Update this AI_AGENT_INSTRUCTIONS.md file

## Contact & Support

- **Repository:** https://github.com/shihan84/dashboardome.git
- **Issues:** Use GitHub Issues for bug reports
- **Documentation:** See README.md for setup instructions

## Last Updated
- **Date:** January 2025
- **Status:** Core features complete, advanced features pending
- **Next Priority:** Fix mock server routes, complete remaining UI components
