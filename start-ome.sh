#!/bin/bash

# OvenMediaEngine Docker Management Script

echo "🐳 OvenMediaEngine Docker Management"
echo "====================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "   You can start it from Applications > Docker.app"
    exit 1
fi

# Function to start OME
start_ome() {
    echo "🚀 Starting OvenMediaEngine..."
    docker-compose -f docker-compose.ome.yml up -d
    echo "✅ OvenMediaEngine started successfully!"
    echo ""
    echo "📡 API Endpoint: http://localhost:9000/v1"
    echo "🔗 Dashboard: http://localhost:5173/"
    echo ""
    echo "📋 Available Services:"
    echo "  - RTMP: rtmp://localhost:1935"
    echo "  - SRT: srt://localhost:9999"
    echo "  - WebRTC: ws://localhost:3333"
    echo "  - LLHLS: http://localhost:9000"
}

# Function to stop OME
stop_ome() {
    echo "🛑 Stopping OvenMediaEngine..."
    docker-compose -f docker-compose.ome.yml down
    echo "✅ OvenMediaEngine stopped successfully!"
}

# Function to show logs
show_logs() {
    echo "📋 OvenMediaEngine Logs:"
    docker-compose -f docker-compose.ome.yml logs -f
}

# Function to show status
show_status() {
    echo "📊 OvenMediaEngine Status:"
    docker-compose -f docker-compose.ome.yml ps
}

# Function to restart OME
restart_ome() {
    echo "🔄 Restarting OvenMediaEngine..."
    docker-compose -f docker-compose.ome.yml restart
    echo "✅ OvenMediaEngine restarted successfully!"
}

# Main script logic
case "$1" in
    start)
        start_ome
        ;;
    stop)
        stop_ome
        ;;
    restart)
        restart_ome
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start OvenMediaEngine container"
        echo "  stop    - Stop OvenMediaEngine container"
        echo "  restart - Restart OvenMediaEngine container"
        echo "  logs    - Show container logs"
        echo "  status  - Show container status"
        exit 1
        ;;
esac
