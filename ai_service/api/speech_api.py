"""
Speech Recognition API for AI-Powered Test Monitoring Platform

This module provides API endpoints for voice recognition testing,
calibration, accent assessment, and microphone feedback.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import base64
import json
import asyncio
from datetime import datetime

# Import local modules
from modules.speech_recognition import SpeechRecognizer


router = APIRouter(prefix="/api/speech", tags=["speech"])

# Global speech recognizer instance
speech_recognizer = SpeechRecognizer()


class AudioChunkRequest(BaseModel):
    """Request model for audio chunk processing"""
    audio_data: str  # Base64 encoded audio
    session_id: Optional[str] = None
    chunk_metadata: Optional[Dict] = None


class CalibrationTestRequest(BaseModel):
    """Request model for voice calibration test"""
    audio_data: Optional[str] = None
    difficulty_level: str = "basic"  # "basic", "intermediate", "advanced"
    session_id: Optional[str] = None


class AccentAssessmentRequest(BaseModel):
    """Request model for accent accuracy assessment"""
    transcription: str
    reference_text: str
    session_id: Optional[str] = None


class MicrophoneFeedbackRequest(BaseModel):
    """Request model for microphone feedback"""
    audio_data: str  # Base64 encoded audio
    session_id: Optional[str] = None


class VoiceCalibrationStartRequest(BaseModel):
    """Request model to start voice calibration"""
    difficulty_level: str = "basic"
    session_id: Optional[str] = None


@router.post("/process-chunk")
async def process_audio_chunk(request: AudioChunkRequest):
    """
    Process an audio chunk for speech recognition or calibration
    """
    try:
        result = speech_recognizer.process_audio_chunk(request.audio_data)

        return {
            "status": "success",
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat(),
            "result": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Audio chunk processing failed: {str(e)}"
        )


@router.post("/analyze-speech")
async def analyze_speech():
    """
    Analyze collected speech for quality and characteristics
    """
    try:
        result = speech_recognizer.analyze_speech()

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "analysis": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech analysis failed: {str(e)}"
        )


@router.post("/start-calibration")
async def start_voice_calibration(request: VoiceCalibrationStartRequest):
    """
    Start comprehensive voice calibration test
    """
    try:
        calibration_result = speech_recognizer.voice_calibration_test(
            difficulty_level=request.difficulty_level
        )

        return {
            "status": "success",
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat(),
            "calibration": calibration_result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Voice calibration start failed: {str(e)}"
        )


@router.post("/calibration-test")
async def voice_calibration_test(request: CalibrationTestRequest):
    """
    Process voice calibration test with audio data
    """
    try:
        # Add audio data to calibration if provided
        if request.audio_data:
            speech_recognizer.process_audio_chunk(request.audio_data)

        # Get calibration status
        calibration_result = speech_recognizer.voice_calibration_test(
            difficulty_level=request.difficulty_level
        )

        return {
            "status": "success",
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat(),
            "calibration": calibration_result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Voice calibration test failed: {str(e)}"
        )


@router.get("/calibration-sentence")
async def get_calibration_sentence(difficulty: str = "basic"):
    """
    Get a random test sentence for voice calibration
    """
    try:
        sentence = speech_recognizer._get_difficulty_specific_sentence(difficulty)

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "difficulty": difficulty,
            "sentence": sentence
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Calibration sentence generation failed: {str(e)}"
        )


@router.post("/accent-assessment")
async def assess_accent_accuracy(request: AccentAssessmentRequest):
    """
    Comprehensive accent accuracy assessment with >85% accuracy target
    """
    try:
        assessment = speech_recognizer.accent_accuracy_assessment(
            transcription=request.transcription,
            reference=request.reference_text
        )

        return {
            "status": "success",
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat(),
            "assessment": assessment
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Accent assessment failed: {str(e)}"
        )


@router.post("/microphone-feedback")
async def get_microphone_feedback(request: MicrophoneFeedbackRequest):
    """
    Real-time microphone feedback system for calibration testing
    """
    try:
        # Decode audio data for analysis
        audio_data = speech_recognizer._decode_audio(request.audio_data)

        # Get microphone feedback
        feedback = speech_recognizer.microphone_feedback_system(audio_data)

        return {
            "status": "success",
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat(),
            "feedback": feedback
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Microphone feedback failed: {str(e)}"
        )


@router.get("/accent-accuracy-scores")
async def get_accent_accuracy_scores():
    """
    Get recent accent accuracy scores for tracking progress
    """
    try:
        scores = speech_recognizer.accent_accuracy_scores.copy()

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "scores": scores,
            "count": len(scores),
            "recent_average": sum(scores) / len(scores) if scores else 0.0,
            "threshold_met": any(score >= speech_recognizer.accent_accuracy_threshold for score in scores[-3:]) if len(scores) >= 3 else False
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Accent accuracy scores retrieval failed: {str(e)}"
        )


@router.get("/voice-quality-score")
async def get_voice_quality_score():
    """
    Calculate overall voice quality score from calibration samples
    """
    try:
        score = speech_recognizer._calculate_voice_quality_score()

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "voice_quality_score": score,
            "samples_count": len(speech_recognizer.calibration_audio_samples),
            "rating": "excellent" if score >= 0.9 else "good" if score >= 0.7 else "fair" if score >= 0.5 else "poor"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Voice quality score calculation failed: {str(e)}"
        )


@router.post("/analyze-background-noise")
async def analyze_background_noise(audio_data: str):
    """
    Enhanced background noise detection with normalization capabilities
    """
    try:
        # Decode audio data
        decoded_audio = speech_recognizer._decode_audio(audio_data)

        # Analyze background noise
        noise_analysis = speech_recognizer._analyze_background_noise_enhanced(decoded_audio)

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "noise_analysis": noise_analysis
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Background noise analysis failed: {str(e)}"
        )


@router.get("/calibration-status")
async def get_calibration_status():
    """
    Get current voice calibration status and progress
    """
    try:
        status = {
            "calibration_active": speech_recognizer.calibration_test_active,
            "current_test_level": speech_recognizer.current_test_level,
            "samples_collected": len(speech_recognizer.calibration_audio_samples),
            "samples_required": speech_recognizer.max_calibration_samples,
            "accuracy_threshold": speech_recognizer.accent_accuracy_threshold,
            "recent_scores": speech_recognizer.accent_accuracy_scores[-5:] if speech_recognizer.accent_accuracy_scores else []
        }

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "calibration_status": status
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Calibration status retrieval failed: {str(e)}"
        )


@router.post("/transcribe-audio")
async def transcribe_audio(audio_data: str):
    """
    Transcribe audio using available speech recognition engines
    """
    try:
        # Decode audio data
        decoded_audio = speech_recognizer._decode_audio(audio_data)

        # Transcribe audio
        transcription = speech_recognizer._transcribe_audio(decoded_audio)

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "transcription": transcription,
            "engines_used": {
                "whisper_available": speech_recognizer.whisper_model is not None,
                "google_available": speech_recognizer.recognizer is not None
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Audio transcription failed: {str(e)}"
        )


@router.post("/reset")
async def reset_speech_recognizer():
    """
    Reset the speech recognizer state
    """
    try:
        speech_recognizer.reset()

        return {
            "status": "success",
            "message": "Speech recognizer reset successfully",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech recognizer reset failed: {str(e)}"
        )


@router.get("/health")
async def speech_health_check():
    """
    Health check for speech recognition API
    """
    try:
        # Check speech recognizer components
        audio_processor_ok = speech_recognizer.audio_processor is not None
        whisper_available = speech_recognizer.whisper_model is not None
        google_available = speech_recognizer.recognizer is not None

        health_status = {
            "status": "healthy",
            "components": {
                "audio_processor": audio_processor_ok,
                "whisper_available": whisper_available,
                "google_available": google_available
            },
            "engines_count": sum([whisper_available, google_available]),
            "timestamp": datetime.now().isoformat()
        }

        # Determine overall health
        if not audio_processor_ok:
            health_status["status"] = "critical"
        elif not (whisper_available or google_available):
            health_status["status"] = "degraded"

        return health_status

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech health check failed: {str(e)}"
        )


@router.get("/config")
async def get_speech_config():
    """
    Get current speech recognition configuration and settings
    """
    try:
        config = {
            "sample_rate": speech_recognizer.sample_rate,
            "accent_accuracy_threshold": speech_recognizer.accent_accuracy_threshold,
            "max_calibration_samples": speech_recognizer.max_calibration_samples,
            "current_test_level": speech_recognizer.current_test_level,
            "calibration_test_active": speech_recognizer.calibration_test_active,
            "test_difficulty_levels": speech_recognizer.test_difficulty_levels
        }

        # Add audio processor config
        if speech_recognizer.audio_processor:
            config["audio_processor"] = {
                "sample_rate": speech_recognizer.audio_processor.sample_rate,
                "frame_length": speech_recognizer.audio_processor.frame_length,
                "hop_length": speech_recognizer.audio_processor.hop_length
            }

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "config": config
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech config retrieval failed: {str(e)}"
        )