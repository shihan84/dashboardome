# Dashboard Components Organization

## 📁 Component Structure Overview

The dashboard components are now organized into logical categories for better maintainability, discoverability, and scalability.

## 🏗️ Directory Structure

```
src/components/
├── core/                           # Core application components
│   ├── layout/                     # Layout components
│   │   ├── Dashboard.tsx          # Main dashboard component
│   │   ├── Footer.tsx             # Dashboard footer
│   │   └── index.ts               # Layout exports
│   ├── ui/                        # UI utility components
│   │   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   │   └── index.ts               # UI exports
│   └── index.ts                   # Core exports
├── management/                     # Management components
│   ├── vhosts/                    # Virtual host management
│   │   ├── VHostManagement.tsx    # VHost & app management
│   │   └── index.ts               # VHost exports
│   ├── channels/                  # Channel management
│   │   ├── ChannelManagement.tsx  # Stream & channel management
│   │   └── index.ts               # Channel exports
│   ├── applications/              # Application management
│   │   ├── OutputProfileConfig.tsx # Output profile configuration
│   │   └── index.ts               # Application exports
│   └── index.ts                   # Management exports
├── monitoring/                     # Monitoring components
│   ├── stats/                     # Statistics & metrics
│   │   ├── StatisticsDashboard.tsx # Server statistics
│   │   ├── RealtimeStats.tsx      # Real-time monitoring
│   │   └── index.ts               # Stats exports
│   ├── streams/                   # Stream monitoring
│   │   ├── StreamMonitor.tsx      # Live stream monitoring
│   │   └── index.ts               # Stream exports
│   ├── performance/               # Performance monitoring
│   │   ├── WebRTCMonitor.tsx      # WebRTC monitoring
│   │   └── index.ts               # Performance exports
│   └── index.ts                   # Monitoring exports
├── streaming/                      # Streaming components
│   ├── ingest/                    # Input/ingest protocols
│   │   ├── IngressHelpers.tsx     # Ingest protocol helpers
│   │   ├── P2PManager.tsx         # P2P management
│   │   └── index.ts               # Ingest exports
│   ├── output/                    # Output protocols
│   │   ├── HLSManager.tsx         # HLS/LLHLS management
│   │   ├── ThumbnailManager.tsx   # Thumbnail generation
│   │   └── index.ts               # Output exports
│   ├── transcoding/               # Transcoding components
│   │   ├── ABRTranscoder.tsx      # ABR transcoding
│   │   ├── ABRManager.tsx         # ABR management
│   │   ├── TranscodeWebhook.tsx   # Transcode webhooks
│   │   └── index.ts               # Transcoding exports
│   ├── players/                   # Player components
│   │   ├── PlayerManager.tsx      # OvenPlayer integration
│   │   ├── EncoderManager.tsx     # OvenLiveKit integration
│   │   ├── DemoManager.tsx        # OvenSpace integration
│   │   └── index.ts               # Player exports
│   └── index.ts                   # Streaming exports
├── security/                       # Security components
│   ├── access/                    # Access control
│   │   ├── AccessControl.tsx      # Access control management
│   │   └── index.ts               # Access exports
│   ├── clustering/                # Clustering
│   │   ├── ClusterManagement.tsx  # Cluster management
│   │   └── index.ts               # Clustering exports
│   ├── tls/                       # TLS/SSL
│   │   ├── TLSStatus.tsx          # TLS status monitoring
│   │   └── index.ts               # TLS exports
│   └── index.ts                   # Security exports
├── compliance/                     # Compliance components
│   ├── scte35/                    # SCTE-35 compliance
│   │   ├── SCTE35Manager.tsx      # SCTE-35 management
│   │   └── index.ts               # SCTE-35 exports
│   ├── validation/                # Validation components
│   │   ├── StreamProfileValidator.tsx # Stream validation
│   │   └── index.ts               # Validation exports
│   └── index.ts                   # Compliance exports
├── recording/                      # Recording components
│   ├── RecordingManager.tsx       # Recording & DVR management
│   └── index.ts                   # Recording exports
├── publishing/                     # Publishing components
│   ├── PushPublishingManager.tsx  # Push publishing management
│   └── index.ts                   # Publishing exports
├── utils/                         # Utility components
│   ├── config/                    # Configuration utilities
│   │   ├── ConfigurationGenerator.tsx # Config generation
│   │   ├── ConnectionSettings.tsx # Connection settings
│   │   └── index.ts               # Config exports
│   ├── testing/                   # Testing utilities
│   │   ├── ConnectionTest.tsx     # Connection testing
│   │   └── index.ts               # Testing exports
│   └── index.ts                   # Utils exports
├── index.ts                       # Main component exports
└── ORGANIZATION.md                # This documentation
```

## 🎯 Component Categories

### **Core Components** (`core/`)
Essential application components that provide the foundation for the dashboard.

- **Layout** (`core/layout/`): Main dashboard layout and structure
- **UI** (`core/ui/`): Reusable UI components and utilities

### **Management Components** (`management/`)
Components for managing OvenMediaEngine resources and configurations.

- **VHosts** (`management/vhosts/`): Virtual host and application management
- **Channels** (`management/channels/`): Stream and channel management
- **Applications** (`management/applications/`): Application configuration and profiles

### **Monitoring Components** (`monitoring/`)
Components for monitoring server performance, streams, and system health.

- **Stats** (`monitoring/stats/`): Statistics dashboards and metrics
- **Streams** (`monitoring/streams/`): Live stream monitoring
- **Performance** (`monitoring/performance/`): Performance monitoring and analysis

### **Streaming Components** (`streaming/`)
Components for managing streaming protocols, transcoding, and players.

- **Ingest** (`streaming/ingest/`): Input protocol management (RTMP, SRT, WebRTC, etc.)
- **Output** (`streaming/output/`): Output protocol management (HLS, WebRTC, etc.)
- **Transcoding** (`streaming/transcoding/`): Transcoding and ABR management
- **Players** (`streaming/players/`): Player integration and management

### **Security Components** (`security/`)
Components for managing security, access control, and clustering.

- **Access** (`security/access/`): Access control and authentication
- **Clustering** (`security/clustering/`): Cluster management and configuration
- **TLS** (`security/tls/`): TLS/SSL status and configuration

### **Compliance Components** (`compliance/`)
Components for broadcast compliance and validation.

- **SCTE-35** (`compliance/scte35/`): SCTE-35 compliance management
- **Validation** (`compliance/validation/`): Stream validation and quality assurance

### **Recording Components** (`recording/`)
Components for managing recording and DVR functionality.

### **Publishing Components** (`publishing/`)
Components for managing push publishing and re-streaming.

### **Utility Components** (`utils/`)
Helper components and utilities.

- **Config** (`utils/config/`): Configuration generation and settings
- **Testing** (`utils/testing/`): Testing and debugging utilities

## 📋 Import Guidelines

### **Component Imports**
```typescript
// Import from specific category
import { VHostManagement } from '../management';
import { RealtimeStats } from '../monitoring';
import { ABRTranscoder } from '../streaming';

// Import from main components index
import { Dashboard, ErrorBoundary } from '../components';
```

### **Service Imports**
```typescript
// Always use relative paths for services
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';
```

### **Utility Imports**
```typescript
// Import utilities from utils directory
import { scte35Utils } from '../../../utils/scte35';
```

## 🔧 Development Guidelines

### **Adding New Components**
1. **Choose the appropriate category** based on component functionality
2. **Create the component** in the relevant subdirectory
3. **Update the index.ts** file in the category directory
4. **Update the main index.ts** if needed
5. **Test the build** to ensure no import errors

### **Moving Components**
1. **Update import paths** in the moved component
2. **Update all references** to the component
3. **Update index files** accordingly
4. **Test thoroughly** to ensure everything works

### **Naming Conventions**
- **Component files**: PascalCase (e.g., `VHostManagement.tsx`)
- **Directories**: lowercase with hyphens (e.g., `vhost-management/`)
- **Index files**: Always named `index.ts`
- **Exports**: Use named exports, not default exports

## ✅ Benefits of This Organization

1. **Logical Grouping**: Components are grouped by functionality
2. **Easy Navigation**: Developers can quickly find relevant components
3. **Scalability**: Easy to add new components without cluttering
4. **Maintainability**: Clear separation of concerns
5. **Import Clarity**: Clear import paths and structure
6. **Team Collaboration**: Multiple developers can work on different categories
7. **Testing**: Easier to test components by category
8. **Documentation**: Self-documenting structure

## 🚀 Future Enhancements

- **Lazy Loading**: Implement lazy loading for component categories
- **Code Splitting**: Split bundles by component categories
- **Testing**: Add category-specific test suites
- **Documentation**: Auto-generate component documentation
- **Storybook**: Create stories for each component category

This organization provides a solid foundation for maintaining and scaling the OvenMediaEngine dashboard! 🎉
