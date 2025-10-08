# OME Compliance Dashboard

A comprehensive web-based management tool for OvenMediaEngine (OME) servers, ensuring 100% compliance with distributor technical specifications.

## 🎯 Features

### **Priority 1: Distributor Compliance Center**
- **SCTE-35 Injection Form**: Smart form for CUE-OUT (Ad Start) and CUE-IN (Ad Stop) with auto-incrementing Event ID, Ad Duration, and Pre-roll
- **Stream Profile Validator**: Live stream technical specs comparison against distributor requirements
- **SCTE-35 Event Log & Timeline**: Real-time visualization and logging of SCTE-35 events
- **Configuration Generator**: Generate compliant OME `<OutputProfile>` XML configurations

### **Priority 2: Core Dashboard Features**
- **Virtual Host Management**: Create, configure, and manage virtual hosts
- **Application Management**: Manage applications with full configuration options
- **Stream Management**: Create, monitor, and manage streams
- **Recording Management**: Start, stop, and monitor stream recordings with scheduling
- **Push Publishing**: SRT, RTMP, and MPEG2-TS push publishing to external destinations
- **Statistics Dashboard**: Comprehensive metrics and performance monitoring
- **Connection Settings**: Configure OME server connections

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OvenMediaEngine server (or use the included mock server)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd ome-compliance-dashboard
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Start the mock OME server (for testing):**
```bash
node mock-ome-server-comprehensive.cjs
```

4. **Access the dashboard:**
- Frontend: http://localhost:5173/
- Mock API: http://localhost:8081/v1

## 🏗️ Architecture

### **Frontend Stack**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Ant Design** for UI components
- **Zustand** for state management
- **Axios** for API communication

### **Backend Integration**
- **OvenMediaEngine REST API** integration
- **WebSocket** support for real-time events
- **Mock server** for development and testing

## 📋 API Endpoints

The dashboard integrates with all OME REST API endpoints:

### **Virtual Host Management**
- `GET /v1/vhosts` - List virtual hosts
- `GET /v1/vhosts/:vhost` - Get virtual host details
- `POST /v1/vhosts` - Create virtual host
- `DELETE /v1/vhosts/:vhost` - Delete virtual host

### **Application Management**
- `GET /v1/vhosts/:vhost/apps` - List applications
- `GET /v1/vhosts/:vhost/apps/:app` - Get application details
- `POST /v1/vhosts/:vhost/apps` - Create application
- `PATCH /v1/vhosts/:vhost/apps/:app` - Update application
- `DELETE /v1/vhosts/:vhost/apps/:app` - Delete application

### **Stream Management**
- `GET /v1/vhosts/:vhost/apps/:app/streams` - List streams
- `GET /v1/vhosts/:vhost/apps/:app/streams/:stream` - Get stream details
- `POST /v1/vhosts/:vhost/apps/:app/streams` - Create stream
- `DELETE /v1/vhosts/:vhost/apps/:app/streams/:stream` - Delete stream

### **SCTE-35 Events**
- `POST /v1/vhosts/:vhost/apps/:app/streams/:stream/sendEvent` - Inject SCTE-35 events

### **Recording Management**
- `POST /v1/vhosts/:vhost/apps/:app:startRecord` - Start recording
- `POST /v1/vhosts/:vhost/apps/:app:stopRecord` - Stop recording
- `POST /v1/vhosts/:vhost/apps/:app:records` - Get recording status

### **Push Publishing**
- `POST /v1/vhosts/:vhost/apps/:app:startPush` - Start push publishing
- `POST /v1/vhosts/:vhost/apps/:app:stopPush` - Stop push publishing
- `POST /v1/vhosts/:vhost/apps/:app:pushes` - Get push status

### **Statistics**
- `GET /v1/stats/current` - Server statistics
- `GET /v1/stats/current/vhosts/:vhost` - Virtual host statistics
- `GET /v1/stats/current/vhosts/:vhost/apps/:app` - Application statistics
- `GET /v1/stats/current/vhosts/:vhost/apps/:app/streams/:stream` - Stream statistics

### **Output Profiles**
- `GET /v1/vhosts/:vhost/apps/:app/outputProfiles` - List output profiles
- `POST /v1/vhosts/:vhost/apps/:app/outputProfiles` - Create output profile

## 🔧 Configuration

### **Connection Settings**
Configure your OME server connection in the dashboard:
- **Host**: OME server hostname (default: localhost)
- **Port**: OME server port (default: 8081)
- **Username**: Basic auth username (optional)
- **Password**: Basic auth password (optional)

### **SCTE-35 Configuration**
The dashboard supports full SCTE-35 compliance:
- **Event Types**: CUE-OUT (Ad Start), CUE-IN (Ad Stop)
- **Auto-incrementing Event IDs**: Automatic event ID management
- **Ad Duration**: Configurable ad break durations
- **Pre-roll**: Pre-roll timing configuration
- **Base64 Encoding**: Automatic SCTE-35 message encoding

### **Stream Profile Validation**
Validate streams against distributor requirements:
- **Resolution**: Video resolution compliance
- **Bitrate**: Video and audio bitrate validation
- **Codec**: Codec compliance checking
- **Audio Settings**: Sample rate, channels, loudness
- **Real-time Monitoring**: Live stream parameter validation

## 📊 Dashboard Components

### **Overview Dashboard**
- Connection status monitoring
- Recent SCTE-35 events
- Compliance status overview
- Quick access to all features

### **SCTE-35 Injection Form**
- Smart form with auto-incrementing Event IDs
- Ad duration and pre-roll configuration
- Real-time SCTE-35 message construction
- Base64 encoding and API injection

### **Stream Profile Validator**
- Live stream technical specifications
- Distributor requirement comparison
- Visual compliance indicators
- Real-time parameter monitoring

### **SCTE-35 Event Log**
- Timeline visualization of events
- Event status tracking
- Real-time WebSocket updates
- Comprehensive event history

### **Configuration Generator**
- Interactive OME configuration builder
- XML output generation
- Parameter validation
- Copy-to-clipboard functionality

### **Virtual Host Management**
- Create and configure virtual hosts
- TLS certificate management
- Security policy configuration
- Origin and admission webhook setup

### **Recording Management**
- Start/stop stream recording
- Schedule-based recording
- Recording status monitoring
- File management and download

### **Push Publishing**
- SRT, RTMP, MPEG2-TS publishing
- External destination configuration
- Publishing status monitoring
- URL template generation

### **Statistics Dashboard**
- Server, vhost, app, and stream metrics
- Connection statistics
- Throughput monitoring
- Performance analytics

## 🛠️ Development

### **Project Structure**
```
src/
├── components/           # React components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── ComplianceInjectionForm.tsx
│   ├── StreamProfileValidator.tsx
│   ├── SCTE35EventLog.tsx
│   ├── ConfigurationGenerator.tsx
│   ├── SCTE35Scheduler.tsx
│   ├── VHostManagement.tsx
│   ├── RecordingManagement.tsx
│   ├── PushPublishingManagement.tsx
│   ├── StatisticsDashboard.tsx
│   └── ConnectionSettings.tsx
├── services/            # API services
│   └── omeApi.ts       # OME API service
├── store/              # State management
│   └── useStore.ts     # Zustand store
├── types/              # TypeScript types
│   └── index.ts       # Type definitions
└── utils/              # Utilities
    └── scte35.ts      # SCTE-35 utilities
```

### **Available Scripts**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### **Mock Server**
The included mock server (`mock-ome-server-comprehensive.cjs`) provides:
- Full OME API simulation
- Realistic mock data
- All endpoint implementations
- Development and testing support

## 🔒 Security

### **Authentication**
- Basic authentication support
- Secure credential storage
- Connection validation

### **SCTE-35 Security**
- Secure event injection
- Message validation
- Audit logging

## 📈 Performance

### **Optimizations**
- React 18 concurrent features
- Efficient state management with Zustand
- Optimized API calls
- Real-time WebSocket updates

### **Monitoring**
- Connection status monitoring
- Performance metrics
- Error tracking
- Real-time statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Test with the mock server
- Submit issues for bugs or feature requests

## 🎉 Acknowledgments

- OvenMediaEngine team for the excellent streaming server
- Ant Design for the beautiful UI components
- React team for the amazing framework
- All contributors and users

---

**Built with ❤️ for OvenMediaEngine compliance and streaming excellence.**