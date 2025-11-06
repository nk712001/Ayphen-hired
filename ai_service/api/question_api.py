"""
Question Engine API for AI-Powered Test Monitoring Platform

This module provides API endpoints for question sequencing,
type management, timer systems, and state management.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import asyncio
from datetime import datetime

# Import local modules
from api.question_engine import QuestionSequencer, QuestionTypeManager, TimerSystem, StateManager
from api.answer_manager import RecordingStateMachine, AnswerValidator, SubmissionAPI


router = APIRouter(prefix="/api/questions", tags=["questions"])

# Global instances
question_sequencer = QuestionSequencer()
question_type_manager = QuestionTypeManager()
timer_system = TimerSystem()
state_manager = StateManager()
recording_state_machine = RecordingStateMachine()
answer_validator = AnswerValidator()
submission_api = SubmissionAPI()


class LoadTestConfigRequest(BaseModel):
    """Request model for loading test configuration"""
    test_config: Dict
    session_id: Optional[str] = None


class QuestionNavigationRequest(BaseModel):
    """Request model for question navigation"""
    question_index: Optional[int] = None
    action: Optional[str] = None  # "next", "previous", "skip", "goto"


class AnswerSubmissionRequest(BaseModel):
    """Request model for answer submission"""
    question: Dict
    answer_data: Dict
    session_id: Optional[str] = None


class TimerRequest(BaseModel):
    """Request model for timer operations"""
    timer_id: str
    action: str  # "start", "pause", "stop", "status"
    duration: Optional[int] = None


class StateUpdateRequest(BaseModel):
    """Request model for state updates"""
    question_id: str
    state: str
    metadata: Optional[Dict] = None
    session_id: Optional[str] = None


@router.post("/load-test")
async def load_test_configuration(request: LoadTestConfigRequest):
    """
    Load test configuration and initialize question sequence
    """
    try:
        result = question_sequencer.load_test_configuration(request.test_config)

        return {
            "status": result["status"],
            "message": result["message"],
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat(),
            "details": {k: v for k, v in result.items() if k not in ["status", "message"]}
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Test configuration loading failed: {str(e)}"
        )


@router.post("/start-test")
async def start_test():
    """
    Start the test and initialize the first question
    """
    try:
        result = question_sequencer.start_test()

        # Initialize state manager
        session_config = {
            'session_id': result.get('session_id'),
            'test_id': question_sequencer.test_config.get('id'),
            'candidate_id': result.get('session_id'),  # Simplified
        }
        state_manager.initialize_session(session_config)

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "test_session": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Test start failed: {str(e)}"
        )


@router.get("/current")
async def get_current_question():
    """
    Get the current question information
    """
    try:
        result = question_sequencer.get_current_question()

        return {
            "status": result["status"],
            "message": result.get("message", ""),
            "timestamp": datetime.now().isoformat(),
            "question": result.get("question"),
            "question_number": result.get("question_number"),
            "total_questions": result.get("total_questions"),
            "time_remaining": result.get("time_remaining")
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Get current question failed: {str(e)}"
        )


@router.post("/navigate")
async def navigate_questions(request: QuestionNavigationRequest):
    """
    Navigate between questions (next, previous, skip, goto)
    """
    try:
        if request.action == "next":
            result = question_sequencer.get_next_question()
        elif request.action == "skip":
            result = question_sequencer.skip_question()
        elif request.action == "goto" and request.question_index is not None:
            result = question_sequencer.go_to_question(request.question_index)
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid navigation request"
            )

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "navigation_result": {k: v for k, v in result.items() if k not in ["status", "message"]}
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Question navigation failed: {str(e)}"
        )


@router.post("/submit-answer")
async def submit_answer(request: AnswerSubmissionRequest):
    """
    Process and validate answer submission
    """
    try:
        # Validate answer
        validation_result = answer_validator.validate_answer(
            request.answer_data,
            request.question
        )

        # Submit answer if validation passes
        if validation_result["result"] in ["valid", "warning"]:
            submission_result = submission_api.submit_answer(
                request.answer_data,
                validation_result
            )
        else:
            submission_result = {
                "status": "error",
                "message": "Answer validation failed",
                "validation_errors": validation_result["errors"]
            }

        # Update question state
        state_update = state_manager.update_question_state(
            request.question["id"],
            "submitted",
            {"submission_id": submission_result.get("submission_id")}
        )

        return {
            "status": "success",
            "message": "Answer submitted successfully",
            "timestamp": datetime.now().isoformat(),
            "validation": validation_result,
            "submission": submission_result,
            "state_update": state_update
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Answer submission failed: {str(e)}"
        )


@router.post("/timer")
async def manage_timer(request: TimerRequest):
    """
    Manage timers for questions (start, pause, stop, status)
    """
    try:
        if request.action == "create" and request.duration:
            result = timer_system.create_timer(request.timer_id, request.duration)
        elif request.action == "start":
            result = timer_system.start_timer(request.timer_id)
        elif request.action == "pause":
            result = timer_system.pause_timer(request.timer_id)
        elif request.action == "stop":
            result = timer_system.stop_timer(request.timer_id)
        elif request.action == "status":
            result = timer_system.get_timer_status(request.timer_id)
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid timer action"
            )

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "timer_result": {k: v for k, v in result.items() if k not in ["status", "message"]}
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Timer management failed: {str(e)}"
        )


@router.get("/timers")
async def get_all_timers():
    """
    Get status of all active timers
    """
    try:
        result = timer_system.get_all_timers()

        return {
            "status": result["status"],
            "timestamp": datetime.now().isoformat(),
            "timers": result.get("timers", {}),
            "total_timers": result.get("total_timers", 0)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Get timers failed: {str(e)}"
        )


@router.post("/state/update")
async def update_question_state(request: StateUpdateRequest):
    """
    Update state for a specific question
    """
    try:
        result = state_manager.update_question_state(
            request.question_id,
            request.state,
            request.metadata
        )

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "overall_progress": result.get("overall_progress", 0.0)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"State update failed: {str(e)}"
        )


@router.get("/state")
async def get_session_state():
    """
    Get current session state
    """
    try:
        result = state_manager.get_session_state()

        return {
            "status": result["status"],
            "timestamp": datetime.now().isoformat(),
            "session_state": result["session_state"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Get session state failed: {str(e)}"
        )


@router.post("/violation")
async def add_violation(violation: Dict):
    """
    Add a violation to the current session
    """
    try:
        result = state_manager.add_violation(violation)

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "violation_id": result.get("violation_id")
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Add violation failed: {str(e)}"
        )


@router.post("/complete")
async def complete_session():
    """
    Mark the session as completed
    """
    try:
        result = state_manager.complete_session()

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "session_summary": result.get("session_summary", {})
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Session completion failed: {str(e)}"
        )


@router.post("/recording/initialize")
async def initialize_recording(recording_config: Dict):
    """
    Initialize a new recording session
    """
    try:
        result = recording_state_machine.initialize_recording(recording_config)

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "recording_id": result.get("recording_id"),
            "metadata": result.get("metadata", {})
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recording initialization failed: {str(e)}"
        )


@router.post("/recording/start")
async def start_recording():
    """
    Start the recording
    """
    try:
        result = recording_state_machine.start_recording()

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "start_time": result.get("start_time"),
            "recording_id": result.get("recording_id")
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recording start failed: {str(e)}"
        )


@router.post("/recording/chunk")
async def add_audio_chunk(audio_data: str, chunk_metadata: Optional[Dict] = None):
    """
    Add an audio chunk to the recording
    """
    try:
        result = recording_state_machine.add_audio_chunk(audio_data, chunk_metadata)

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "chunk_sequence": result.get("chunk_sequence"),
            "total_chunks": result.get("total_chunks"),
            "current_duration": result.get("current_duration")
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Audio chunk addition failed: {str(e)}"
        )


@router.post("/recording/pause")
async def pause_recording():
    """
    Pause the recording
    """
    try:
        result = recording_state_machine.pause_recording()

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "paused_duration": result.get("paused_duration")
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recording pause failed: {str(e)}"
        )


@router.post("/recording/resume")
async def resume_recording():
    """
    Resume a paused recording
    """
    try:
        result = recording_state_machine.resume_recording()

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "current_duration": result.get("current_duration")
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recording resume failed: {str(e)}"
        )


@router.post("/recording/stop")
async def stop_recording(reason: str = "Manual stop"):
    """
    Stop the recording
    """
    try:
        result = recording_state_machine.stop_recording(reason)

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "total_duration": result.get("total_duration"),
            "total_chunks": result.get("total_chunks"),
            "stop_reason": result.get("stop_reason")
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recording stop failed: {str(e)}"
        )


@router.post("/recording/review")
async def start_review():
    """
    Start the review phase
    """
    try:
        result = recording_state_machine.start_review()

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "recording_duration": result.get("recording_duration"),
            "chunks_count": result.get("chunks_count")
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Review start failed: {str(e)}"
        )


@router.get("/recording/preview")
async def get_recording_preview():
    """
    Get a preview of the recording for review
    """
    try:
        result = recording_state_machine.get_recording_preview()

        return {
            "status": result["status"],
            "timestamp": datetime.now().isoformat(),
            "preview": result.get("preview", {})
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recording preview failed: {str(e)}"
        )


@router.post("/recording/submit")
async def submit_recording():
    """
    Submit the recording
    """
    try:
        result = recording_state_machine.submit_recording()

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat(),
            "submission_data": result.get("submission_data", {})
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recording submission failed: {str(e)}"
        )


@router.get("/recording/state")
async def get_recording_state():
    """
    Get current recording state information
    """
    try:
        result = recording_state_machine.get_state_info()

        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "recording_state": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Get recording state failed: {str(e)}"
        )


@router.post("/recording/reset")
async def reset_recording():
    """
    Reset the recording state machine
    """
    try:
        result = recording_state_machine.reset()

        return {
            "status": result["status"],
            "message": result["message"],
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recording reset failed: {str(e)}"
        )


@router.get("/health")
async def question_engine_health_check():
    """
    Health check for question engine API
    """
    try:
        health_status = {
            "status": "healthy",
            "components": {
                "question_sequencer": question_sequencer is not None,
                "question_type_manager": question_type_manager is not None,
                "timer_system": timer_system is not None,
                "state_manager": state_manager is not None,
                "recording_state_machine": recording_state_machine is not None,
                "answer_validator": answer_validator is not None,
                "submission_api": submission_api is not None
            },
            "timestamp": datetime.now().isoformat()
        }

        # Check if all components are healthy
        all_healthy = all(health_status["components"].values())
        if not all_healthy:
            health_status["status"] = "degraded"

        return health_status

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Question engine health check failed: {str(e)}"
        )