"""
Camera API for AI-Powered Test Monitoring Platform

This module provides API endpoints for camera management,
validation, setup guidance, and third-camera control.
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
from modules.multi_camera import MultiCameraManager
from modules.face_detection import FaceDetector
from modules.secondary_camera_analyzer import SecondaryCameraAnalyzer


router = APIRouter(prefix="/api/camera", tags=["camera"])

# Global camera manager instance
camera_manager = MultiCameraManager()


class CameraFrameRequest(BaseModel):
    """Request model for camera frame analysis"""
    frame_data: str  # Base64 encoded image
    camera_type: str  # "primary" or "secondary"
    session_id: Optional[str] = None


class ThirdCameraControlRequest(BaseModel):
    """Request model for third camera control"""
    enabled: bool
    interviewer_override: bool = False


class SetupGuideRequest(BaseModel):
    """Request model for camera setup guidance"""
    primary_frame_data: Optional[str] = None
    secondary_frame_data: Optional[str] = None
    session_id: Optional[str] = None


class ValidationRequest(BaseModel):
    """Request model for third camera validation"""
    primary_frame_data: str
    secondary_frame_data: Optional[str] = None
    session_id: Optional[str] = None


@router.post("/validate")
async def validate_camera(request: CameraFrameRequest):
    """
    Validate camera position and detect face/object presence
    """
    try:
        if request.camera_type == "primary":
            result = camera_manager.validate_primary_camera(request.frame_data)
        elif request.camera_type == "secondary":
            result = camera_manager.validate_secondary_camera(request.frame_data)
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid camera type. Must be 'primary' or 'secondary'"
            )

        return {
            "status": "success",
            "camera_type": request.camera_type,
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat(),
            "result": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Camera validation failed: {str(e)}"
        )


@router.post("/validate-dual")
async def validate_dual_camera(
    primary_frame_data: str,
    secondary_frame_data: Optional[str] = None
):
    """
    Validate both primary and secondary cameras simultaneously
    """
    try:
        result = camera_manager.process_dual_camera(
            primary_frame_data=primary_frame_data,
            secondary_frame_data=secondary_frame_data
        )

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "result": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Dual camera validation failed: {str(e)}"
        )


@router.post("/setup-guide")
async def get_setup_guide(request: SetupGuideRequest):
    """
    Get real-time camera setup guidance overlay
    """
    try:
        # Update camera manager with current frames
        if request.primary_frame_data:
            camera_manager.primary_frame = camera_manager._decode_image(request.primary_frame_data)

        if request.secondary_frame_data:
            camera_manager.secondary_frame = camera_manager._decode_image(request.secondary_frame_data)

        # Enable setup overlay
        camera_manager.setup_overlay_active = True

        # Get setup guidance
        guidance = camera_manager.setup_guide_overlay()

        return {
            "status": "success",
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat(),
            "guidance": guidance
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Setup guide generation failed: {str(e)}"
        )


@router.post("/validate-third-camera")
async def validate_third_camera_position(request: ValidationRequest):
    """
    Enhanced validation for third camera position with >90% accuracy requirement
    """
    try:
        # Update camera manager with frames
        camera_manager.primary_frame = camera_manager._decode_image(request.primary_frame_data)

        if request.secondary_frame_data:
            camera_manager.secondary_frame = camera_manager._decode_image(request.secondary_frame_data)

        # Perform validation
        validation_result = camera_manager.validate_third_camera_position()

        return {
            "status": "success",
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat(),
            "validation": validation_result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Third camera validation failed: {str(e)}"
        )


@router.post("/toggle-third-camera-control")
async def toggle_third_camera_control(request: ThirdCameraControlRequest):
    """
    Toggle third camera control for interviewer remote management
    """
    try:
        control_result = camera_manager.toggle_third_camera_control(
            enabled=request.enabled,
            interviewer_override=request.interviewer_override
        )

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "control": control_result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Third camera control toggle failed: {str(e)}"
        )


@router.get("/third-camera-status")
async def get_third_camera_status():
    """
    Get comprehensive third camera status and control information
    """
    try:
        status = camera_manager.get_third_camera_status()

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "third_camera_status": status
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Third camera status check failed: {str(e)}"
        )


@router.get("/violation-prevention-status")
async def get_violation_prevention_status():
    """
    Get current violation prevention status based on secondary camera analysis
    """
    try:
        status = camera_manager.get_violation_prevention_status()

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "violation_prevention": status
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Violation prevention status check failed: {str(e)}"
        )


@router.get("/secondary-camera-violations")
async def get_secondary_camera_violations():
    """
    Get violations detected by secondary camera analysis
    """
    try:
        violations = camera_manager.get_secondary_camera_violations()

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "violations": violations,
            "count": len(violations)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Secondary camera violations retrieval failed: {str(e)}"
        )


@router.post("/should-suppress-violations")
async def check_should_suppress_violations():
    """
    Determine if violations should be suppressed based on secondary camera analysis
    """
    try:
        should_suppress = camera_manager.should_suppress_violations()

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "should_suppress": should_suppress
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Violation suppression check failed: {str(e)}"
        )


@router.post("/reset")
async def reset_camera_manager():
    """
    Reset camera manager state
    """
    try:
        # Reset the camera manager
        camera_manager.__init__()

        return {
            "status": "success",
            "message": "Camera manager reset successfully",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Camera manager reset failed: {str(e)}"
        )


@router.get("/health")
async def camera_health_check():
    """
    Health check for camera API
    """
    try:
        # Check camera manager components
        primary_detector_ok = camera_manager.primary_detector is not None
        secondary_detector_ok = camera_manager.secondary_detector is not None
        secondary_analyzer_ok = camera_manager.secondary_analyzer is not None

        health_status = {
            "status": "healthy" if all([primary_detector_ok, secondary_detector_ok, secondary_analyzer_ok]) else "degraded",
            "components": {
                "primary_detector": primary_detector_ok,
                "secondary_detector": secondary_detector_ok,
                "secondary_analyzer": secondary_analyzer_ok
            },
            "timestamp": datetime.now().isoformat()
        }

        return health_status

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Camera health check failed: {str(e)}"
        )


@router.get("/config")
async def get_camera_config():
    """
    Get current camera configuration and settings
    """
    try:
        config = {
            "third_camera_quality_threshold": camera_manager.third_camera_quality_threshold,
            "max_validation_frames": camera_manager.max_validation_frames,
            "setup_overlay_active": camera_manager.setup_overlay_active,
            "interviewer_control_enabled": camera_manager.interviewer_control_enabled,
            "history_size": camera_manager.history_size
        }

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "config": config
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Camera config retrieval failed: {str(e)}"
        )