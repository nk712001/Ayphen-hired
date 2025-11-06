#!/usr/bin/env python3
"""
Simple HTTP server to serve the frontend
"""

import http.server
import socketserver
import os

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(DIRECTORY)

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        port = httpd.server_address[1]

        print(f"🚀 Frontend server running on http://localhost:{port}")
        print(f"📁 Serving files from: {DIRECTORY}")
        print(f"🌐 Open your browser and visit: http://localhost:{port}/test_frontend.html")
        print(f"🔗 Make sure the test server is running on http://localhost:8001")
        print("\n📊 Features available:")
        print("  • API Connection Testing")
        print("  • Camera Validation")
        print("  • Voice Calibration")
        print("  • Recording Controls")
        print("  • Question Engine Testing")
        print("  • Real-time Status Updates")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.server_close()