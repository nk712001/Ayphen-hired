#!/usr/bin/env python3
"""
Simple WebSocket server to test WebSocket connections
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import ssl
import os
import json

app = FastAPI(title="WebSocket Test Server")

# SSL Certificate paths
CERT_FILE = "../certs/cert.pem"
KEY_FILE = "../certs/key.pem"

# Check if SSL certificates exist
ssl_context = None
if os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE):
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain(CERT_FILE, KEY_FILE)
    print(f"[INFO] SSL certificates loaded successfully from {CERT_FILE} and {KEY_FILE}")
else:
    print(f"[WARNING] SSL certificates not found at {CERT_FILE} and {KEY_FILE}. Running without HTTPS.")

# Configure CORS - allow all origins for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "WebSocket Test Server"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.websocket("/ws/test")
async def websocket_test(websocket: WebSocket):
    await websocket.accept()
    print("[INFO] WebSocket connection accepted on /ws/test")
    
    try:
        while True:
            # Wait for a message
            data = await websocket.receive_text()
            print(f"[INFO] Received: {data}")
            
            # Echo the message back
            await websocket.send_text(f"Echo: {data}")
            print(f"[INFO] Sent echo response")
            
    except WebSocketDisconnect:
        print("[INFO] WebSocket disconnected")
    except Exception as e:
        print(f"[ERROR] WebSocket error: {e}")

@app.websocket("/ws/proctor/{session_id}")
async def websocket_proctor(websocket: WebSocket, session_id: str):
    await websocket.accept()
    print(f"[INFO] WebSocket connection accepted on /ws/proctor/{session_id}")
    
    try:
        # Send initial connection success message
        await websocket.send_json({
            "status": "clear",
            "violations": [],
            "metrics": {
                "face_confidence": 0.9,
                "gaze_score": 0.95,
                "objects_detected": 0
            },
            "message": "Test server connected successfully"
        })
        
        while True:
            # Wait for a message
            data = await websocket.receive_text()
            print(f"[INFO] Received from session {session_id}: {data}")
            
            # Echo the message back with a proper response format
            await websocket.send_json({
                "status": "clear",
                "violations": [],
                "metrics": {
                    "face_confidence": 0.9,
                    "gaze_score": 0.95,
                    "objects_detected": 0
                },
                "message": f"Echo: {data}"
            })
            print(f"[INFO] Sent response to session {session_id}")
            
    except WebSocketDisconnect:
        print(f"[INFO] WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"[ERROR] WebSocket error for session {session_id}: {e}")

if __name__ == "__main__":
    print("[INFO] Starting WebSocket Test Server")
    
    if ssl_context:
        # Run with HTTPS
        uvicorn.run(
            "test_websocket:app", 
            host="0.0.0.0", 
            port=8001,  # Use different port to avoid conflicts with main service
            ssl_keyfile="../certs/key.pem",
            ssl_certfile="../certs/cert.pem"
        )
    else:
        # Run without HTTPS
        uvicorn.run("test_websocket:app", host="0.0.0.0", port=8001)
