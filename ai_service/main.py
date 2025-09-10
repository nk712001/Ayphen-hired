from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
import asyncio
import numpy as np
import base64

from modules.face_detection import FaceDetector
from modules.gaze_tracking import GazeTracker
from modules.object_detection import ObjectDetector
from modules.audio_processing import AudioProcessor

app = FastAPI(title="Test Monitor AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections
class ProctorSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.face_detector = FaceDetector()
        self.gaze_tracker = GazeTracker()
        self.object_detector = ObjectDetector()
        self.audio_processor = AudioProcessor()
        self.violations: List[Dict] = []

    def process_video_frame(self, frame_data: str) -> Dict:
        # Process video frame with all detectors
        face_results = self.face_detector.analyze_frame(frame_data)
        gaze_results = self.gaze_tracker.analyze_gaze(frame_data)
        object_results = self.object_detector.analyze_frame(frame_data)

        # Combine results
        violations = []
        if face_results.get('violations'):
            violations.extend(face_results['violations'])
        if gaze_results.get('status') == 'attention_violation':
            violations.append({
                'type': 'gaze_violation',
                'severity': 'medium',
                'confidence': gaze_results['confidence']
            })
        if object_results.get('status') == 'violation':
            violations.extend([
                {
                    'type': 'prohibited_object',
                    'severity': object_results['severity'],
                    'details': det
                }
                for det in object_results['detections']
            ])

        return {
            'status': 'violation' if violations else 'clear',
            'violations': violations,
            'metrics': {
                'face_confidence': face_results.get('confidence', 0.0),
                'gaze_score': gaze_results.get('attention_score', 0.0),
                'objects_detected': len(object_results.get('detections', []))
            }
        }

    def process_audio_frame(self, audio_data: np.ndarray) -> Dict:
        return self.audio_processor.process_audio(audio_data)

    def reset(self):
        self.face_detector = FaceDetector()
        self.gaze_tracker.reset_state()
        self.object_detector.reset_state()
        self.audio_processor.reset_state()
        self.violations.clear()

class ConnectionManager:
    def __init__(self):
        self.sessions: Dict[str, ProctorSession] = {}
        self.connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.sessions:
            self.sessions[session_id] = ProctorSession(session_id)
        self.connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.connections:
            del self.connections[session_id]
        if session_id in self.sessions:
            self.sessions[session_id].reset()
            del self.sessions[session_id]

    async def process_frame(self, session_id: str, frame_type: str, frame_data: str) -> Dict:
        session = self.sessions.get(session_id)
        if not session:
            return {'status': 'error', 'message': 'Session not found'}

        if frame_type == 'video':
            return session.process_video_frame(frame_data)
        elif frame_type == 'audio':
            # Convert base64 audio to numpy array
            audio_bytes = base64.b64decode(frame_data)
            audio_data = np.frombuffer(audio_bytes, dtype=np.float32)
            return session.process_audio_frame(audio_data)
        else:
            return {'status': 'error', 'message': 'Invalid frame type'}

manager = ConnectionManager()

@app.websocket("/ws/proctor/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_json()
            frame_type = data.get('type')
            frame_data = data.get('data')

            if not frame_type or not frame_data:
                await websocket.send_json({
                    'status': 'error',
                    'message': 'Invalid frame data'
                })
                continue

            # Process frame and send results
            results = await manager.process_frame(session_id, frame_type, frame_data)
            await websocket.send_json(results)

    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        print(f"Error in session {session_id}: {e}")
        manager.disconnect(session_id)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
