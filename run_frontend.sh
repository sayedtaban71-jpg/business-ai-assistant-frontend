#!/bin/bash

echo "🎨 Starting Frontend Server..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Starting Next.js server on http://0.0.0.0:3000"
echo "🔑 PID will be saved to frontend.pid"
echo ""

# Run in background and save PID
nohup npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid

echo "✅ Frontend server started with PID: $(cat frontend.pid)"
echo "📋 Commands:"
echo "  tail -f frontend.log    # View frontend logs"
echo "  kill \$(cat frontend.pid)  # Stop frontend server"
echo ""
