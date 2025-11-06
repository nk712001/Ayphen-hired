#!/usr/bin/env python3
"""
Simple WebSocket client to test the AI service WebSocket endpoint
"""

import asyncio
import json
import ssl
import websockets
import sys

async def test_websocket(url):
    """Test WebSocket connection to the given URL"""
    print(f"Connecting to {url}...")
    
    # Create SSL context that accepts self-signed certificates
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    try:
        async with websockets.connect(url, ssl=ssl_context) as websocket:
            print("Connected successfully!")
            
            # Send a test message
            test_message = {
                "type": "test",
                "data": "connection-test"
            }
            await websocket.send(json.dumps(test_message))
            print(f"Sent: {test_message}")
            
            # Wait for response
            print("Waiting for response...")
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Keep connection open for a bit
            await asyncio.sleep(2)
            
            print("Test completed successfully!")
            return True
    except Exception as e:
        print(f"Error: {e}")
        return False

async def main():
    # Test both localhost and IP address
    urls = [
        "wss://127.0.0.1:8000/ws/proctor/test-session",
        "wss://localhost:8000/ws/proctor/test-session",
        "ws://127.0.0.1:8000/ws/proctor/test-session",
        "ws://localhost:8000/ws/proctor/test-session"
    ]
    
    for url in urls:
        print(f"\n--- Testing {url} ---")
        success = await test_websocket(url)
        if success:
            print(f"✅ Connection to {url} succeeded")
        else:
            print(f"❌ Connection to {url} failed")

if __name__ == "__main__":
    asyncio.run(main())
