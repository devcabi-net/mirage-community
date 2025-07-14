#!/bin/bash

# Status Dashboard Startup Script
# This script starts the comprehensive system status monitoring dashboard

set -e

# Configuration
PORT=${STATUS_PORT:-8080}
LOG_FILE="${LOG_FILE:-status-dashboard.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠️  $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
}

# Function to check if port is available
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_error "Port $PORT is already in use. Please stop the service using that port or change STATUS_PORT."
        exit 1
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    if [ ! -d "uploads" ]; then
        mkdir -p uploads
        print_success "Created uploads directory"
    fi
    
    if [ ! -d "logs" ]; then
        mkdir -p logs
        print_success "Created logs directory"
    fi
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js to run the status dashboard."
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "status-server.js" ]; then
        print_error "status-server.js not found. Please ensure the file is in the current directory."
        exit 1
    fi
    
    if [ ! -f "status-dashboard.html" ]; then
        print_error "status-dashboard.html not found. Please ensure the file is in the current directory."
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Function to display system info
show_system_info() {
    print_status "System Information:"
    echo "  - Node.js version: $(node --version)"
    echo "  - Operating System: $(uname -s)"
    echo "  - Architecture: $(uname -m)"
    echo "  - Current directory: $(pwd)"
    echo "  - Dashboard port: $PORT"
    echo "  - Log file: $LOG_FILE"
    echo ""
}

# Function to start the dashboard
start_dashboard() {
    print_status "Starting Status Dashboard..."
    
    # Set environment variables
    export STATUS_PORT=$PORT
    
    # Start the server
    print_success "Status Dashboard is starting on port $PORT"
    print_status "Access the dashboard at: http://localhost:$PORT"
    print_status "API endpoint available at: http://localhost:$PORT/api/status"
    print_status "Press Ctrl+C to stop the dashboard"
    echo ""
    
    # Start the Node.js server
    node status-server.js 2>&1 | tee -a "$LOG_FILE"
}

# Function to handle cleanup on exit
cleanup() {
    print_status "Shutting down Status Dashboard..."
    print_success "Status Dashboard stopped"
    exit 0
}

# Main function
main() {
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    # Print header
    echo ""
    echo "======================================"
    echo "    System Status Dashboard"
    echo "======================================"
    echo ""
    
    # Run checks
    check_dependencies
    check_port
    create_directories
    show_system_info
    
    # Start dashboard
    start_dashboard
}

# Help function
show_help() {
    echo "Status Dashboard Startup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --port PORT    Set the port for the dashboard (default: 8080)"
    echo "  -l, --log FILE     Set the log file path (default: status-dashboard.log)"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  STATUS_PORT        Port for the status server"
    echo "  LOG_FILE           Log file path"
    echo ""
    echo "Examples:"
    echo "  $0                 Start with default settings"
    echo "  $0 -p 9090         Start on port 9090"
    echo "  $0 -l /var/log/status.log  Use custom log file"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -l|--log)
            LOG_FILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main