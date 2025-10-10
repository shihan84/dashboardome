#!/bin/bash

# Script to switch between Mock OME Server and Real OvenMediaEngine

echo "🔄 OME Server Switcher"
echo "====================="

case "$1" in
    mock)
        echo "🔄 Switching to Mock OME Server..."
        # Stop real OME if running
        docker-compose -f docker-compose.ome.yml down 2>/dev/null || true
        
        # Start mock server
        echo "🚀 Starting Mock OME Server..."
        node mock-ome-server.cjs &
        MOCK_PID=$!
        echo $MOCK_PID > mock-server.pid
        
        # Update dashboard config to use mock server
        sed -i '' 's/omePort: 9000/omePort: 8081/' src/store/useStore.ts
        
        echo "✅ Switched to Mock OME Server (Port 8081)"
        echo "📡 Mock API: http://localhost:8081/v1"
        echo "🔗 Dashboard: http://localhost:5173/"
        ;;
    real)
        echo "🔄 Switching to Real OvenMediaEngine..."
        # Stop mock server if running
        if [ -f mock-server.pid ]; then
            kill $(cat mock-server.pid) 2>/dev/null || true
            rm mock-server.pid
        fi
        
        # Start real OME
        echo "🚀 Starting Real OvenMediaEngine..."
        docker-compose -f docker-compose.ome.yml up -d
        
        # Update dashboard config to use real OME
        sed -i '' 's/omePort: 8081/omePort: 9000/' src/store/useStore.ts
        
        echo "✅ Switched to Real OvenMediaEngine (Port 9000)"
        echo "📡 Real API: http://localhost:9000/v1"
        echo "🔗 Dashboard: http://localhost:5173/"
        ;;
    status)
        echo "📊 Current Server Status:"
        echo ""
        
        # Check mock server
        if [ -f mock-server.pid ] && kill -0 $(cat mock-server.pid) 2>/dev/null; then
            echo "🟢 Mock OME Server: Running (Port 8081)"
        else
            echo "🔴 Mock OME Server: Stopped"
        fi
        
        # Check real OME
        if docker-compose -f docker-compose.ome.yml ps | grep -q "Up"; then
            echo "🟢 Real OvenMediaEngine: Running (Port 9000)"
        else
            echo "🔴 Real OvenMediaEngine: Stopped"
        fi
        
        # Check dashboard
        if curl -s http://localhost:5173/ > /dev/null 2>&1; then
            echo "🟢 Dashboard: Running (Port 5173)"
        else
            echo "🔴 Dashboard: Stopped"
        fi
        ;;
    *)
        echo "Usage: $0 {mock|real|status}"
        echo ""
        echo "Commands:"
        echo "  mock   - Switch to Mock OME Server (Port 8081)"
        echo "  real   - Switch to Real OvenMediaEngine (Port 9000)"
        echo "  status - Show current server status"
        exit 1
        ;;
esac
