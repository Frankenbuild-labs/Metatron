#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
from pathlib import Path

# Set the port
PORT = 9001

# Change to the current directory (frontend)
current_dir = Path(__file__).parent
os.chdir(current_dir)
print(f"✅ Serving from: {current_dir}")

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
        super().end_headers()

    def do_GET(self):
        # Serve newfrontend.html for root path
        if self.path == '/':
            self.path = '/newfrontend.html'
        return super().do_GET()

# Create the server
try:
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"""
╔══════════════════════════════════════╗
║     Metatraon Frontend Started      ║
╠══════════════════════════════════════╣
║  Running on: http://localhost:{PORT}  ║
║  Local IP: http://127.0.0.1:{PORT}     ║
╚══════════════════════════════════════╝
        """)
        print(f"🚀 Metatraon Frontend is ready!")
        print(f"📱 Open http://localhost:{PORT} in your browser")
        print(f"✅ Server is listening and ready for connections...")
        print(f"📁 Serving newfrontend.html from: {os.getcwd()}")
        
        httpd.serve_forever()
        
except KeyboardInterrupt:
    print("\n🛑 Shutting down server...")
    print("✅ Server stopped")
except Exception as e:
    print(f"❌ Error starting server: {e}")
    sys.exit(1)
