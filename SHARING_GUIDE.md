# OME Compliance Dashboard - Sharing Guide

## 🚀 Quick Start for New Users

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/shihan84/dashboardome.git
cd dashboardome

# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start mock server
node mock-ome-server.cjs
```

### Access
- **Dashboard:** http://localhost:5173/
- **Mock API:** http://localhost:8081/v1

## 🌐 Deployment Options

### 1. Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### 2. Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### 3. Docker
```bash
docker build -t ome-dashboard .
docker run -p 5173:5173 ome-dashboard
```

## 📁 Project Structure
```
ome-compliance-dashboard/
├── src/
│   ├── components/     # React components
│   ├── services/       # API services
│   ├── store/         # State management
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── mock-ome-server.cjs # Mock server
└── README.md          # Documentation
```

## 🔧 Configuration

### OME Server Connection
1. Open dashboard
2. Go to "Connection Settings"
3. Enter your OME server details:
   - Host: your-ome-server.com
   - Port: 8081
   - Username/Password (if required)

### Mock Server (for testing)
```bash
node mock-ome-server.cjs
```

## 📚 Features

- **SCTE-35 Compliance:** Injection, validation, scheduling
- **Stream Management:** Virtual hosts, applications, streams
- **Recording:** Start/stop recording, status monitoring
- **Push Publishing:** SRT, RTMP, MPEG2-TS publishing
- **Statistics:** Real-time server metrics
- **Configuration:** OME output profile generation

## 🆘 Troubleshooting

### Common Issues
1. **Port conflicts:** Change ports in vite.config.ts
2. **Mock server errors:** Use mock-ome-server.cjs (basic version)
3. **Import errors:** Ensure all dependencies are installed

### Support
- **Repository:** https://github.com/shihan84/dashboardome.git
- **Issues:** Use GitHub Issues for bug reports
- **Documentation:** See README.md and AI_AGENT_INSTRUCTIONS.md

## 🔐 Security Notes

- Keep personal access tokens secure
- Use environment variables for production
- Configure proper authentication for OME servers
- Review CORS settings for cross-origin requests

## 📈 Performance

- **Development:** Hot module replacement enabled
- **Production:** Optimized build with Vite
- **Mock Server:** Lightweight Express.js server
- **State Management:** Efficient Zustand store

## 🎯 Next Steps

1. **Customize:** Modify components for your needs
2. **Deploy:** Choose your preferred deployment method
3. **Integrate:** Connect to your OME server
4. **Extend:** Add new features as needed

---

**Repository:** https://github.com/shihan84/dashboardome.git  
**Documentation:** See README.md for complete setup instructions
