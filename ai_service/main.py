from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
import json
import asyncio
import numpy as np
import base64
import os
import ssl
import uvicorn
import time

from modules.face_detection import FaceDetector
from modules.gaze_tracking import GazeTracker
from modules.object_detection import ObjectDetector
from modules.audio_processing import AudioProcessor
from modules.multi_camera import MultiCameraManager
from modules.speech_recognition import SpeechRecognizer

app = FastAPI(title="Test Monitor AI Service")

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

# Global warm-up flag
WARMUP_COMPLETE = False

# Model warm-up routine
async def warmup_models():
    global WARMUP_COMPLETE
    print("[WARMUP] Starting model warm-up...")
    try:
        # Warm up FaceDetector
        fd = FaceDetector()
        fd._ensure_model_loaded()
        dummy_img = np.zeros((720, 1280, 3), dtype=np.uint8)
        try:
            fd.detector(dummy_img, 0)
        except Exception as e:
            print(f"[WARMUP] FaceDetector error: {e}")
        # Warm up GazeTracker
        gt = GazeTracker()
        gt._ensure_model_loaded()
        try:
            gt.detector(np.zeros((720, 1280), dtype=np.uint8))
        except Exception as e:
            print(f"[WARMUP] GazeTracker error: {e}")
        # Warm up ObjectDetector
        od = ObjectDetector()
        od._ensure_model_loaded()
        try:
            od.model(dummy_img)
        except Exception as e:
            print(f"[WARMUP] ObjectDetector error: {e}")
        WARMUP_COMPLETE = True
        print("[WARMUP] All models warmed up.")
    except Exception as e:
        print(f"[WARMUP] Model warm-up failed: {e}")
        WARMUP_COMPLETE = False

@app.on_event("startup")
async def startup_event():
    # Run model warm-up
    await warmup_models()
    
    # Log SSL status
    if ssl_context:
        print("[INFO] HTTPS enabled with SSL certificates")
    else:
        print("[WARNING] Running without HTTPS - camera features may not work on mobile devices")

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
        self.multi_camera_manager = MultiCameraManager()
        self.speech_recognizer = SpeechRecognizer()
        self.violations: List[Dict] = []
        self.secondary_camera_active = False
        self.secondary_camera_required = False

    def process_video_frame(self, frame_data: str) -> Dict:
        # Process video frame with all detectors
        face_results = self.face_detector.analyze_frame(frame_data)
        
        # Decode image for gaze and object detection
        try:
            import base64
            import cv2
            import numpy as np
            img_data = base64.b64decode(frame_data)
            nparr = np.frombuffer(img_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            gaze_results = self.gaze_tracker.analyze_gaze(image)
            object_results = self.object_detector.analyze_frame(image)
        except Exception as e:
            print(f"[ERROR] Failed to decode image for gaze/object detection: {e}")
            gaze_results = {"status": "error", "error": str(e)}
            object_results = {"status": "error", "error": str(e)}

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
                    'message': det['class'],
                    'confidence': det['confidence']
                }
                for det in object_results['detections']
            ])

        # Add secondary camera violations if secondary camera is active
        secondary_camera_violations = []
        if self.secondary_camera_active and hasattr(self.multi_camera_manager, 'get_secondary_camera_violations'):
            secondary_camera_violations = self.multi_camera_manager.get_secondary_camera_violations()
            if secondary_camera_violations:
                print(f"[SECONDARY_CAMERA] Detected {len(secondary_camera_violations)} violations from secondary camera")
                violations.extend(secondary_camera_violations)

        # Check if violations should be suppressed based on secondary camera analysis
        violation_suppression_active = False
        if self.secondary_camera_active and hasattr(self.multi_camera_manager, 'should_suppress_violations'):
            violation_suppression_active = self.multi_camera_manager.should_suppress_violations()
            if violation_suppression_active:
                print(f"[VIOLATION_SUPPRESSION] Secondary camera AI indicates low risk - suppressing {len([v for v in violations if v.get('source') != 'secondary_camera'])} primary camera violations")
                # Keep violations for logging but mark them as suppressed (except secondary camera violations)
                for violation in violations:
                    if violation.get('source') != 'secondary_camera':  # Don't suppress secondary camera violations
                        violation['suppressed'] = True
                        violation['suppression_reason'] = 'secondary_camera_ai_validation'

        # Calculate face confidence based on detection results
        face_confidence = 0.0
        if face_results.get('faces_detected', 0) > 0:
            # Face detected - use high confidence
            face_confidence = face_results.get('confidence', 0.9)
        else:
            # No face detected - check if it's an error or genuine no-face
            if not any(v.get('type') == 'no_face' for v in face_results.get('violations', [])):
                # No violations means processing succeeded but no face found
                face_confidence = 0.1
            else:
                # Explicit no-face violation
                face_confidence = 0.0

        # Filter out suppressed violations for status determination
        active_violations = [v for v in violations if not v.get('suppressed', False)]

        return {
            'status': 'violation' if active_violations else 'clear',
            'violations': violations,  # Include all violations (suppressed and active)
            'active_violations': active_violations,  # Only non-suppressed violations
            'violation_suppression': {
                'active': violation_suppression_active,
                'suppressed_count': len(violations) - len(active_violations)
            },
            'metrics': {
                'face_confidence': face_confidence,
                'faces_detected': face_results.get('faces_detected', 0),
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
        self.speech_recognizer.reset()
        self.violations.clear()
        self.secondary_camera_active = False

class ConnectionManager:
    def __init__(self):
        self.sessions: Dict[str, ProctorSession] = {}
        self.connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.sessions:
            self.sessions[session_id] = ProctorSession(session_id)
        self.connections[session_id] = websocket

    def create_session(self, session_id: str):
        """Create a new session if it doesn't exist"""
        if session_id not in self.sessions:
            self.sessions[session_id] = ProctorSession(session_id)
        return self.sessions[session_id]

    def disconnect(self, session_id: str):
        if session_id in self.connections:
            del self.connections[session_id]
        if session_id in self.sessions:
            self.sessions[session_id].reset()
            del self.sessions[session_id]

    async def process_frame(self, session_id: str, frame_type: str, frame_data: str, secondary_frame_data: Optional[str] = None) -> Dict:
        session = self.sessions.get(session_id)
        if not session:
            # For secondary camera analysis during setup, create session on-demand
            if frame_type == 'secondary_camera_frame':
                print(f"[SESSION_CREATION] Creating on-demand session for secondary camera analysis: {session_id}")
                session = ProctorSession(session_id)
                self.sessions[session_id] = session
            else:
                return {'status': 'error', 'message': 'Session not found'}

        if frame_type == 'video':
            # Check if secondary frame data is present and auto-activate if needed
            if secondary_frame_data and not session.secondary_camera_active:
                print(f"[AUTO_ACTIVATE] Auto-activating secondary camera for session {session_id} due to received frame data")
                session.secondary_camera_active = True

            if secondary_frame_data and session.secondary_camera_active:
                # Process dual camera setup
                dual_camera_result = session.multi_camera_manager.process_dual_camera(frame_data, secondary_frame_data)
                # Also process primary camera for violation detection with AI suppression
                primary_analysis = session.process_video_frame(frame_data)
                
                # Get secondary camera violations from the analysis
                secondary_violations = session.multi_camera_manager.get_secondary_camera_violations()
                
                # Combine violations from both cameras
                combined_violations = primary_analysis.get('violations', []) + secondary_violations
                active_violations = [v for v in combined_violations if not v.get('suppressed', False)]
                
                # Combine results
                return {
                    **primary_analysis,
                    'violations': combined_violations,
                    'active_violations': active_violations,
                    'status': 'violation' if active_violations else 'clear',
                    'dual_camera_analysis': dual_camera_result,
                    'secondary_camera_ai': dual_camera_result.get('secondary_camera', {}).get('ai_analysis', {}),
                    'secondary_camera_violations': secondary_violations
                }
            else:
                # Process single camera
                return session.process_video_frame(frame_data)
        elif frame_type == 'audio':
            try:
                # Convert base64 audio to numpy array
                print(f"[MAIN DEBUG] Received audio frame, base64 length: {len(frame_data)}")
                audio_bytes = base64.b64decode(frame_data)
                print(f"[MAIN DEBUG] Decoded audio bytes length: {len(audio_bytes)}")
                audio_data = np.frombuffer(audio_bytes, dtype=np.float32)
                print(f"[MAIN DEBUG] Audio numpy array shape: {audio_data.shape}, dtype: {audio_data.dtype}")
                result = session.process_audio_frame(audio_data)
                print(f"[MAIN DEBUG] Audio processing result: {result}")
                return result
            except Exception as e:
                print(f"[MAIN ERROR] Audio processing failed: {e}")
                return {'status': 'error', 'error': str(e), 'violations': [], 'metrics': {'voice_activity_level': 0.0}}
        elif frame_type == 'secondary_camera_frame':
            try:
                # Auto-activate secondary camera if not already active (temporary fix)
                if not session.secondary_camera_active:
                    print(f"[AUTO_ACTIVATE] Auto-activating secondary camera for session {session_id}")
                    session.secondary_camera_active = True
                
                # Process secondary camera frame for AI analysis
                if session.secondary_camera_active:
                    analysis_result = session.multi_camera_manager.secondary_analyzer.analyze_secondary_camera_frame(frame_data)
                    return {
                        'status': 'success',
                        'analysis': analysis_result,
                        'violation_prevention_status': session.multi_camera_manager.get_violation_prevention_status()
                    }
                else:
                    return {'status': 'error', 'error': 'Secondary camera not active', 'message': 'Secondary camera must be validated first'}
            except Exception as e:
                print(f"[MAIN ERROR] Secondary camera analysis failed: {e}")
                return {'status': 'error', 'error': str(e), 'message': "Secondary camera analysis failed"}
        elif frame_type == 'speech_test':
            try:
                # Process speech recognition test
                return session.speech_recognizer.process_audio_chunk(frame_data)
            except Exception as e:
                print(f"[MAIN ERROR] Speech recognition failed: {e}")
                return {'status': 'error', 'error': str(e), 'message': "Speech recognition failed"}
        elif frame_type == 'camera_validation':
            try:
                # Validate camera position
                if secondary_frame_data:
                    # Secondary camera validation with AI analysis
                    validation_result = session.multi_camera_manager.validate_secondary_camera(frame_data)
                    # Activate secondary camera if validation is successful
                    if validation_result.get('position_valid', False):
                        session.secondary_camera_active = True
                        print(f"[CAMERA_VALIDATION] Secondary camera activated for session {session_id}")
                    return validation_result
                else:
                    # Primary camera validation
                    return session.multi_camera_manager.validate_primary_camera(frame_data)
            except Exception as e:
                print(f"[MAIN ERROR] Camera validation failed: {e}")
                return {'status': 'error', 'error': str(e), 'position_valid': False}
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
            secondary_frame_data = data.get('secondary_data')  # For dual camera setup

            if not frame_type or not frame_data:
                await websocket.send_json({
                    'status': 'error',
                    'message': 'Invalid frame data'
                })
                continue

            # Process frame and send results
            results = await manager.process_frame(session_id, frame_type, frame_data, secondary_frame_data)
            await websocket.send_json(results)

    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        print(f"Error in session {session_id}: {e}")
        manager.disconnect(session_id)

@app.get("/health")
async def health_check():
    if WARMUP_COMPLETE:
        return {"status": "healthy"}
    else:
        return {"status": "not_ready"}

@app.post("/api/speech-test/get-sentence")
async def get_test_sentence(request: Request):
    """Get a random sentence for the speech recognition test"""
    try:
        data = await request.json()
        session_id = data.get('session_id')
        
        if not session_id or session_id not in manager.sessions:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Invalid or missing session ID"}
            )
        
        session = manager.sessions[session_id]
        sentence = session.speech_recognizer.get_random_sentence()
        
        return {"status": "success", "sentence": sentence}
    except Exception as e:
        print(f"Error getting test sentence: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.post("/api/speech-test/init-session")
async def init_speech_session(request: Request):
    """Initialize a speech recognition session"""
    try:
        data = await request.json()
        session_id = data.get('session_id')
        
        if not session_id:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Missing session ID"}
            )
        
        print(f"[SPEECH INIT] Initializing session: {session_id}")
        
        # Create or get existing session
        if session_id not in manager.sessions:
            print(f"[SPEECH INIT] Creating new session: {session_id}")
            manager.create_session(session_id)
        else:
            print(f"[SPEECH INIT] Using existing session: {session_id}")
        
        session = manager.sessions[session_id]
        
        # Initialize speech recognizer if not already done
        if not hasattr(session, 'speech_recognizer') or session.speech_recognizer is None:
            print(f"[SPEECH INIT] Creating speech recognizer for session: {session_id}")
            from modules.speech_recognition import SpeechRecognizer
            session.speech_recognizer = SpeechRecognizer()
        
        print(f"[SPEECH INIT] ✅ Session {session_id} initialized successfully")
        
        return {
            "status": "success", 
            "message": "Speech session initialized",
            "session_id": session_id
        }
        
    except Exception as e:
        print(f"[SPEECH INIT] Error initializing session: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.post("/api/speech-test/process")
async def process_speech_test(request: Request):
    """Process speech recognition test with AI-powered transcription and comparison"""
    try:
        data = await request.json()
        session_id = data.get('session_id')
        audio_data = data.get('audio_data')
        reference_text = data.get('reference_text')
        
        if not session_id or not audio_data:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Missing session ID or audio data"}
            )
        
        if session_id not in manager.sessions:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Invalid session ID"}
            )
        
        session = manager.sessions[session_id]
        
        # Process the complete audio recording (not streaming chunks)
        print(f"[SPEECH] Processing complete audio for session {session_id}")
        result = session.speech_recognizer.process_complete_audio(audio_data, reference_text)
        
        if result.get('status') == 'complete':
            # Convert numpy types to Python native types for JSON serialization
            audio_quality = result.get('audio_quality', {})
            for key, value in audio_quality.items():
                if hasattr(value, 'item'):  # numpy scalar
                    audio_quality[key] = float(value.item())
                elif isinstance(value, (np.float32, np.float64)):
                    audio_quality[key] = float(value)
            
            recognition_accuracy = result.get('recognition_accuracy', 0)
            if hasattr(recognition_accuracy, 'item'):
                recognition_accuracy = float(recognition_accuracy.item())
            
            return {
                "status": "complete",
                "audio_quality": audio_quality,
                "recognition_accuracy": float(recognition_accuracy),
                "message": result.get('message', ''),
                "recognition_feedback": result.get('recognition_feedback', ''),
                "reference_text": result.get('reference_text', ''),
                "transcribed_text": result.get('transcribed_text', ''),  # Add the actual transcription
                "is_acceptable": result.get('is_acceptable', False),
                "voice_activity": result.get('voice_activity', 0),
                "background_noise": result.get('background_noise', 0)
            }
        else:
            return result
            
    except Exception as e:
        print(f"Error processing speech test: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.post("/setup/camera/configure")
async def configure_camera(request: Request):
    """Configure camera settings for a session"""
    try:
        data = await request.json()
        session_id = data.get('session_id')
        secondary_camera_required = data.get('secondary_camera_required', False)
        
        if not session_id or session_id not in manager.sessions:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Invalid or missing session ID"}
            )
        
        session = manager.sessions[session_id]
        session.secondary_camera_required = secondary_camera_required
        
        return {
            "status": "success", 
            "message": "Camera configuration updated",
            "secondary_camera_required": secondary_camera_required
        }
    except Exception as e:
        print(f"Error configuring camera: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.post("/api/secondary-camera-analysis/{session_id}")
async def analyze_secondary_camera_direct(session_id: str, request: dict):
    """
    Direct HTTP endpoint for secondary camera analysis (bypasses WebSocket issues)
    """
    try:
        print(f"[SECONDARY_ANALYSIS_HTTP] Starting analysis for session {session_id}")
        
        frame_data = request.get('frameData')
        if not frame_data:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "No frame data provided"}
            )
        
        # Ensure session exists
        if session_id not in manager.sessions:
            manager.sessions[session_id] = ProctorSession(session_id)
        
        session = manager.sessions[session_id]
        
        # Auto-activate secondary camera if not already active
        if not session.secondary_camera_active:
            print(f"[SECONDARY_ANALYSIS_HTTP] Auto-activating secondary camera for session {session_id}")
            session.secondary_camera_active = True
        
        # Process secondary camera frame for AI analysis
        analysis_result = session.multi_camera_manager.secondary_analyzer.analyze_secondary_camera_frame(frame_data)
        
        print(f"[SECONDARY_ANALYSIS_HTTP] Analysis completed successfully")
        print(f"[SECONDARY_ANALYSIS_HTTP] Violation prevention: {analysis_result.get('violation_prevention', {})}")
        
        # Update the secondary analysis cache so violation prevention status works
        session.multi_camera_manager.secondary_analysis_cache = analysis_result
        
        # Import the convert_numpy_types function to ensure JSON serialization
        from modules.secondary_camera_analyzer import convert_numpy_types
        
        # Convert all numpy types to native Python types for JSON serialization
        clean_analysis_result = convert_numpy_types(analysis_result)
        clean_violation_prevention_status = convert_numpy_types(session.multi_camera_manager.get_violation_prevention_status())
        
        return {
            'status': 'success',
            'analysis': clean_analysis_result,
            'violation_prevention_status': clean_violation_prevention_status,
            'timestamp': time.time()
        }
        
    except Exception as e:
        print(f"[SECONDARY_ANALYSIS_HTTP] Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@app.post("/api/primary-camera-analysis/{session_id}")
async def analyze_primary_camera_direct(session_id: str, request: dict = Body(...)):
    """
    Direct HTTP endpoint for primary camera analysis
    """
    try:
        print(f"[PRIMARY_ANALYSIS_HTTP] Starting analysis for session {session_id}")
        
        frame_data = request.get('frameData')
        if not frame_data:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "No frame data provided"}
            )
        
        # Ensure session exists
        if session_id not in manager.sessions:
            manager.sessions[session_id] = ProctorSession(session_id)
        
        session = manager.sessions[session_id]
        
        # Process primary camera frame for AI analysis
        primary_validation = session.multi_camera_manager.validate_primary_camera(frame_data)
        
        # Get face detection analysis
        face_analysis = session.face_detector.analyze_frame(session.multi_camera_manager._decode_image(frame_data))
        
        # Get object detection analysis (for prohibited items)
        object_analysis = session.object_detector.analyze_frame(session.multi_camera_manager._decode_image(frame_data), context='primary')
        
        # Get gaze tracking analysis
        gaze_analysis = session.gaze_tracker.analyze_gaze(session.multi_camera_manager._decode_image(frame_data))
        
        # Combine all analyses into a comprehensive result
        analysis_result = {
            'camera_validation': primary_validation,
            'face_detection': face_analysis,
            'object_detection': object_analysis,
            'gaze_tracking': gaze_analysis,
            'overall_compliance': {
                'status': primary_validation.get('status', 'unknown'),
                'position_valid': primary_validation.get('position_valid', False),
                'faces_detected': face_analysis.get('faces_detected', 0),
                'prohibited_items': len(object_analysis.get('detections', [])),
                'gaze_score': gaze_analysis.get('gaze_score', 0.0),
                'overall_score': _calculate_primary_compliance_score(primary_validation, face_analysis, object_analysis, gaze_analysis)
            },
            'violation_prevention': {
                'risk_level': _assess_primary_risk_level(primary_validation, face_analysis, object_analysis, gaze_analysis),
                'prevention_effectiveness': primary_validation.get('position_valid', False) and face_analysis.get('faces_detected', 0) > 0,
                'confidence': _calculate_primary_confidence(primary_validation, face_analysis, object_analysis, gaze_analysis)
            },
            'recommendations': _generate_primary_recommendations(primary_validation, face_analysis, object_analysis, gaze_analysis)
        }
        
        print(f"[PRIMARY_ANALYSIS_HTTP] Analysis completed successfully")
        print(f"[PRIMARY_ANALYSIS_HTTP] Overall compliance: {analysis_result['overall_compliance']['overall_score']:.2f}")
        
        # Import the convert_numpy_types function to ensure JSON serialization
        from modules.secondary_camera_analyzer import convert_numpy_types
        
        # Convert all numpy types to native Python types for JSON serialization
        clean_analysis_result = convert_numpy_types(analysis_result)
        
        return {
            'status': 'success',
            'analysis': clean_analysis_result,
            'timestamp': time.time()
        }
        
    except Exception as e:
        print(f"[PRIMARY_ANALYSIS_HTTP] Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

def _calculate_primary_compliance_score(validation, face_analysis, object_analysis, gaze_analysis):
    """Calculate overall compliance score for primary camera"""
    score = 0.0
    
    # Face detection (40% weight)
    if face_analysis.get('faces_detected', 0) > 0:
        score += 0.4
    
    # Camera position (30% weight)
    if validation.get('position_valid', False):
        score += 0.3
    
    # No prohibited items (20% weight)
    if len(object_analysis.get('detections', [])) == 0:
        score += 0.2
    
    # Gaze tracking (10% weight)
    gaze_score = gaze_analysis.get('gaze_score', 0.0)
    score += 0.1 * min(gaze_score, 1.0)
    
    return min(score, 1.0)

def _assess_primary_risk_level(validation, face_analysis, object_analysis, gaze_analysis):
    """Assess risk level for primary camera"""
    issues = 0
    
    if face_analysis.get('faces_detected', 0) == 0:
        issues += 2  # No face is a major issue
    
    if not validation.get('position_valid', False):
        issues += 1
    
    if len(object_analysis.get('detections', [])) > 0:
        issues += 2  # Prohibited items are major issues
    
    if gaze_analysis.get('gaze_score', 0.0) < 0.3:
        issues += 1
    
    if issues >= 3:
        return 'high'
    elif issues >= 1:
        return 'medium'
    else:
        return 'low'

def _calculate_primary_confidence(validation, face_analysis, object_analysis, gaze_analysis):
    """Calculate confidence level for primary camera analysis"""
    confidence = 0.0
    
    # High confidence if face is detected and positioned well
    if face_analysis.get('faces_detected', 0) > 0 and validation.get('position_valid', False):
        confidence += 0.6
    
    # Additional confidence for no prohibited items
    if len(object_analysis.get('detections', [])) == 0:
        confidence += 0.3
    
    # Gaze tracking adds confidence
    confidence += 0.1 * min(gaze_analysis.get('gaze_score', 0.0), 1.0)
    
    return min(confidence, 1.0)

def _generate_primary_recommendations(validation, face_analysis, object_analysis, gaze_analysis):
    """Generate recommendations for primary camera setup"""
    recommendations = []
    
    if face_analysis.get('faces_detected', 0) == 0:
        recommendations.append("Position your face clearly in the camera view")
    
    if not validation.get('position_valid', False):
        recommendations.append("Adjust camera position for better face detection")
    
    if len(object_analysis.get('detections', [])) > 0:
        prohibited_items = [det['class'] for det in object_analysis.get('detections', [])]
        recommendations.append(f"Remove prohibited items from view: {', '.join(set(prohibited_items))}")
    
    if gaze_analysis.get('gaze_score', 0.0) < 0.5:
        recommendations.append("Look directly at the camera more frequently")
    
    if not recommendations:
        recommendations.append("Primary camera setup looks good!")
    
    return recommendations


# Add a main block to run the server with SSL if available
    # Get port from environment variable (default to 8000)
    port = int(os.environ.get("PORT", 8000))
    
    if ssl_context:
        # Run with HTTPS
        uvicorn.run(
            "main:app", 
            host="0.0.0.0", 
            port=port, 
            ssl_keyfile="../certs/key.pem",
            ssl_certfile="../certs/cert.pem"
        )
    else:
        # Run without HTTPS
        uvicorn.run("main:app", host="0.0.0.0", port=port)
