# Dashboard Components Organization

This directory contains all React components for the OvenMediaEngine Dashboard, organized into logical categories for better maintainability and development experience.

## Directory Structure

```
components/
├── core/                    # Core application components
│   ├── Dashboard.tsx       # Main dashboard component
│   ├── ErrorBoundary.tsx   # Error boundary wrapper
│   ├── Footer.tsx          # Application footer
│   └── index.ts           # Core exports
├── management/              # Server and resource management
│   ├── VHostAppsManager.tsx    # Virtual hosts and applications
│   ├── VHostManagement.tsx     # Virtual host management
│   ├── ChannelManagement.tsx   # Channel management
│   └── index.ts               # Management exports
├── monitoring/              # Monitoring and statistics
│   ├── StreamMonitor.tsx       # Live stream monitoring
│   ├── StatisticsDashboard.tsx # Statistics and metrics
│   └── index.ts               # Monitoring exports
├── streaming/               # Streaming and transcoding
│   ├── ABRTranscoder.tsx      # ABR profiles and transcoding
│   ├── IngressHelpers.tsx     # Ingest/playback helpers
│   └── index.ts               # Streaming exports
├── recording/               # Recording and DVR
│   ├── RecordingDVR.tsx       # Recording and DVR management
│   ├── RecordingManagement.tsx # Recording controls
│   └── index.ts               # Recording exports
├── publishing/              # Push publishing
│   ├── PushPublishing.tsx     # Push publishing management
│   ├── PushPublishingManagement.tsx # Publishing controls
│   └── index.ts               # Publishing exports
├── security/                # Security and access control
│   ├── AccessControl.tsx      # Access control settings
│   ├── TLSStatus.tsx          # TLS certificate status
│   ├── ClusterManagement.tsx  # Cluster management
│   └── index.ts               # Security exports
├── compliance/              # SCTE-35 compliance
│   ├── SCTE35Manager.tsx      # SCTE-35 management
│   ├── SCTE35Scheduler.tsx    # SCTE-35 scheduling
│   ├── SCTE35EventLog.tsx     # SCTE-35 event logs
│   ├── ComplianceInjectionForm.tsx # Compliance injection
│   └── index.ts               # Compliance exports
├── utils/                   # Utility components
│   ├── StreamProfileValidator.tsx # Stream profile validation
│   ├── ConfigurationGenerator.tsx # Configuration generation
│   ├── ConnectionSettings.tsx     # Connection settings
│   └── index.ts                 # Utility exports
└── index.ts                 # Main component exports
```

## Component Categories

### Core Components
- **Dashboard**: Main application component with navigation and layout
- **ErrorBoundary**: Error handling wrapper for the application
- **Footer**: Application footer with status information

### Management Components
- **VHostAppsManager**: Comprehensive virtual hosts and applications management
- **VHostManagement**: Virtual host configuration and management
- **ChannelManagement**: Channel setup and configuration

### Monitoring Components
- **StreamMonitor**: Real-time stream monitoring with thumbnails and controls
- **StatisticsDashboard**: Comprehensive statistics and metrics display

### Streaming Components
- **ABRTranscoder**: ABR profiles and transcoder configuration
- **IngressHelpers**: Helper tools for various ingest and playback protocols

### Recording Components
- **RecordingDVR**: Recording and DVR configuration and controls
- **RecordingManagement**: Recording session management

### Publishing Components
- **PushPublishing**: Push publishing targets and status management
- **PushPublishingManagement**: Publishing session controls

### Security Components
- **AccessControl**: Access control and authentication settings
- **TLSStatus**: TLS certificate status and configuration
- **ClusterManagement**: Cluster and edge-origin configuration

### Compliance Components
- **SCTE35Manager**: SCTE-35 event management and injection
- **SCTE35Scheduler**: SCTE-35 event scheduling
- **SCTE35EventLog**: SCTE-35 event logging and history
- **ComplianceInjectionForm**: SCTE-35 compliance injection interface

### Utility Components
- **StreamProfileValidator**: Stream profile validation tools
- **ConfigurationGenerator**: Configuration file generation utilities
- **ConnectionSettings**: OME server connection configuration

## Usage

Import components using the organized structure:

```typescript
// Import specific components
import { Dashboard, ErrorBoundary } from './components/core';
import { VHostAppsManager, StreamMonitor } from './components';

// Or import from main index
import { 
  Dashboard, 
  VHostAppsManager, 
  StreamMonitor,
  ABRTranscoder 
} from './components';
```

## Benefits of This Organization

1. **Logical Grouping**: Components are grouped by functionality and purpose
2. **Easy Navigation**: Developers can quickly find related components
3. **Maintainability**: Changes to related features are contained in specific directories
4. **Scalability**: Easy to add new components to appropriate categories
5. **Clean Imports**: Organized import structure reduces clutter
6. **Documentation**: Clear structure makes the codebase self-documenting
