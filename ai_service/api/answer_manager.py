"""
Answer Manager for AI-Powered Test Monitoring Platform

This module handles recording state machines, answer validation,
and secure submission APIs. Supports both audio recording and code submission
with comprehensive state tracking and validation.
"""

import asyncio
import json
import time
import uuid
import base64
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Callable
from enum import Enum
import io
import wave


class RecordingState(Enum):
    """Enumeration of recording states"""
    IDLE = "idle"
    PREPARING = "preparing"
    RECORDING = "recording"
    PAUSED = "paused"
    STOPPED = "stopped"
    REVIEWING = "reviewing"
    SUBMITTING = "submitting"
    SUBMITTED = "submitted"
    ERROR = "error"


class AnswerType(Enum):
    """Enumeration of answer types"""
    AUDIO = "audio"
    CODE = "code"
    TEXT = "text"
    FILE = "file"


class ValidationResult(Enum):
    """Enumeration of validation results"""
    VALID = "valid"
    INVALID = "invalid"
    WARNING = "warning"
    PENDING = "pending"


class RecordingStateMachine:
    """
    Manages the recording state machine for audio answers.
    Handles state transitions, recording controls, and data collection.
    """

    def __init__(self):
        self.current_state = RecordingState.IDLE
        self.recording_id = None
        self.recording_data = []
        self.start_time = None
        self.pause_time = None
        self.total_duration = 0
        self.paused_duration = 0
        self.metadata = {}
        self.error_message = None
        self.state_history = []
        self.max_recording_duration = 300  # 5 minutes default
        self.min_recording_duration = 5   # 5 seconds minimum

    def initialize_recording(self, recording_config: Dict) -> Dict:
        """
        Initialize a new recording session

        Args:
            recording_config: Configuration for the recording session

        Returns:
            Status of initialization
        """
        try:
            if self.current_state != RecordingState.IDLE:
                return {
                    'status': 'error',
                    'message': f'Cannot initialize recording in state: {self.current_state.value}',
                    'current_state': self.current_state.value
                }

            required_fields = ['question_id', 'max_duration', 'min_duration']
            for field in required_fields:
                if field not in recording_config:
                    return {
                        'status': 'error',
                        'message': f'Missing required field: {field}'
                    }

            self.recording_id = str(uuid.uuid4())
            self.max_recording_duration = recording_config.get('max_duration', 300)
            self.min_recording_duration = recording_config.get('min_duration', 5)
            self.metadata = {
                'question_id': recording_config['question_id'],
                'question_type': recording_config.get('question_type', 'conversational'),
                'sample_rate': recording_config.get('sample_rate', 16000),
                'channels': recording_config.get('channels', 1),
                'bit_depth': recording_config.get('bit_depth', 16),
                'format': recording_config.get('format', 'wav'),
                'initialized_at': datetime.now().isoformat()
            }

            self._transition_to_state(RecordingState.PREPARING)

            return {
                'status': 'success',
                'message': 'Recording initialized successfully',
                'recording_id': self.recording_id,
                'max_duration': self.max_recording_duration,
                'min_duration': self.min_recording_duration,
                'metadata': self.metadata
            }

        except Exception as e:
            self.error_message = str(e)
            self._transition_to_state(RecordingState.ERROR)
            return {
                'status': 'error',
                'message': f'Failed to initialize recording: {str(e)}'
            }

    def start_recording(self) -> Dict:
        """Start the recording"""
        try:
            if self.current_state != RecordingState.PREPARING:
                return {
                    'status': 'error',
                    'message': f'Cannot start recording in state: {self.current_state.value}',
                    'current_state': self.current_state.value
                }

            self.start_time = time.time()
            self.recording_data = []
            self.total_duration = 0
            self.paused_duration = 0
            self.pause_time = None

            self._transition_to_state(RecordingState.RECORDING)

            return {
                'status': 'success',
                'message': 'Recording started',
                'recording_id': self.recording_id,
                'start_time': datetime.fromtimestamp(self.start_time).isoformat(),
                'max_duration': self.max_recording_duration
            }

        except Exception as e:
            self.error_message = str(e)
            self._transition_to_state(RecordingState.ERROR)
            return {
                'status': 'error',
                'message': f'Failed to start recording: {str(e)}'
            }

    def add_audio_chunk(self, audio_data: str, chunk_metadata: Dict = None) -> Dict:
        """
        Add an audio chunk to the recording

        Args:
            audio_data: Base64 encoded audio data
            chunk_metadata: Optional metadata for the chunk

        Returns:
            Status of chunk addition
        """
        try:
            if self.current_state != RecordingState.RECORDING:
                return {
                    'status': 'error',
                    'message': f'Cannot add audio chunk in state: {self.current_state.value}',
                    'current_state': self.current_state.value
                }

            if not audio_data:
                return {
                    'status': 'error',
                    'message': 'No audio data provided'
                }

            # Validate audio data format (simplified)
            try:
                decoded_audio = base64.b64decode(audio_data)
                if len(decoded_audio) == 0:
                    raise ValueError("Empty audio data")
            except Exception as e:
                return {
                    'status': 'error',
                    'message': f'Invalid audio data format: {str(e)}'
                }

            chunk_info = {
                'data': audio_data,
                'timestamp': time.time(),
                'size': len(decoded_audio),
                'sequence': len(self.recording_data)
            }

            if chunk_metadata:
                chunk_info.update(chunk_metadata)

            self.recording_data.append(chunk_info)

            # Check duration limits
            current_duration = self.get_current_duration()
            if current_duration >= self.max_recording_duration:
                return self.stop_recording(reason="Maximum duration reached")

            return {
                'status': 'success',
                'message': 'Audio chunk added',
                'chunk_sequence': chunk_info['sequence'],
                'total_chunks': len(self.recording_data),
                'current_duration': current_duration
            }

        except Exception as e:
            self.error_message = str(e)
            return {
                'status': 'error',
                'message': f'Failed to add audio chunk: {str(e)}'
            }

    def pause_recording(self) -> Dict:
        """Pause the recording"""
        try:
            if self.current_state != RecordingState.RECORDING:
                return {
                    'status': 'error',
                    'message': f'Cannot pause recording in state: {self.current_state.value}',
                    'current_state': self.current_state.value
                }

            self.pause_time = time.time()
            self._transition_to_state(RecordingState.PAUSED)

            return {
                'status': 'success',
                'message': 'Recording paused',
                'paused_duration': self.get_current_duration()
            }

        except Exception as e:
            self.error_message = str(e)
            return {
                'status': 'error',
                'message': f'Failed to pause recording: {str(e)}'
            }

    def resume_recording(self) -> Dict:
        """Resume a paused recording"""
        try:
            if self.current_state != RecordingState.PAUSED:
                return {
                    'status': 'error',
                    'message': f'Cannot resume recording in state: {self.current_state.value}',
                    'current_state': self.current_state.value
                }

            if self.pause_time:
                pause_duration = time.time() - self.pause_time
                self.paused_duration += pause_duration
                self.pause_time = None

            self._transition_to_state(RecordingState.RECORDING)

            return {
                'status': 'success',
                'message': 'Recording resumed',
                'current_duration': self.get_current_duration()
            }

        except Exception as e:
            self.error_message = str(e)
            return {
                'status': 'error',
                'message': f'Failed to resume recording: {str(e)}'
            }

    def stop_recording(self, reason: str = "Manual stop") -> Dict:
        """Stop the recording"""
        try:
            if self.current_state not in [RecordingState.RECORDING, RecordingState.PAUSED]:
                return {
                    'status': 'error',
                    'message': f'Cannot stop recording in state: {self.current_state.value}',
                    'current_state': self.current_state.value
                }

            self.total_duration = self.get_current_duration()
            self.metadata['stopped_at'] = datetime.now().isoformat()
            self.metadata['stop_reason'] = reason

            self._transition_to_state(RecordingState.STOPPED)

            return {
                'status': 'success',
                'message': 'Recording stopped',
                'total_duration': self.total_duration,
                'total_chunks': len(self.recording_data),
                'stop_reason': reason
            }

        except Exception as e:
            self.error_message = str(e)
            return {
                'status': 'error',
                'message': f'Failed to stop recording: {str(e)}'
            }

    def start_review(self) -> Dict:
        """Start the review phase"""
        try:
            if self.current_state != RecordingState.STOPPED:
                return {
                    'status': 'error',
                    'message': f'Cannot start review in state: {self.current_state.value}',
                    'current_state': self.current_state.value
                }

            # Validate minimum duration
            if self.total_duration < self.min_recording_duration:
                return {
                    'status': 'error',
                    'message': f'Recording too short: {self.total_duration}s (minimum: {self.min_recording_duration}s)',
                    'current_duration': self.total_duration,
                    'min_duration': self.min_recording_duration
                }

            self._transition_to_state(RecordingState.REVIEWING)

            return {
                'status': 'success',
                'message': 'Review started',
                'recording_duration': self.total_duration,
                'chunks_count': len(self.recording_data)
            }

        except Exception as e:
            self.error_message = str(e)
            return {
                'status': 'error',
                'message': f'Failed to start review: {str(e)}'
            }

    def get_recording_preview(self) -> Dict:
        """Get a preview of the recording for review"""
        try:
            if self.current_state not in [RecordingState.REVIEWING, RecordingState.SUBMITTED]:
                return {
                    'status': 'error',
                    'message': f'Cannot get preview in state: {self.current_state.value}',
                    'current_state': self.current_state.value
                }

            # Combine audio chunks for preview (simplified)
            preview_data = {
                'recording_id': self.recording_id,
                'duration': self.total_duration,
                'metadata': self.metadata,
                'chunks_count': len(self.recording_data),
                'file_size_estimate': sum(chunk['size'] for chunk in self.recording_data),
                'sample_rate': self.metadata.get('sample_rate', 16000),
                'channels': self.metadata.get('channels', 1)
            }

            return {
                'status': 'success',
                'preview': preview_data
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to get recording preview: {str(e)}'
            }

    def submit_recording(self) -> Dict:
        """Submit the recording"""
        try:
            if self.current_state != RecordingState.REVIEWING:
                return {
                    'status': 'error',
                    'message': f'Cannot submit recording in state: {self.current_state.value}',
                    'current_state': self.current_state.value
                }

            self._transition_to_state(RecordingState.SUBMITTING)

            # Prepare recording data for submission
            submission_data = self._prepare_submission_data()

            self._transition_to_state(RecordingState.SUBMITTED)
            self.metadata['submitted_at'] = datetime.now().isoformat()

            return {
                'status': 'success',
                'message': 'Recording submitted successfully',
                'submission_data': submission_data
            }

        except Exception as e:
            self.error_message = str(e)
            self._transition_to_state(RecordingState.ERROR)
            return {
                'status': 'error',
                'message': f'Failed to submit recording: {str(e)}'
            }

    def _prepare_submission_data(self) -> Dict:
        """Prepare recording data for submission"""
        try:
            # Combine all audio chunks
            combined_audio = self._combine_audio_chunks()

            # Generate file hash for integrity
            file_hash = hashlib.sha256(combined_audio).hexdigest()

            submission_data = {
                'answer_id': str(uuid.uuid4()),
                'recording_id': self.recording_id,
                'type': AnswerType.AUDIO.value,
                'duration': self.total_duration,
                'file_size': len(combined_audio),
                'file_hash': file_hash,
                'metadata': self.metadata,
                'state_history': self.state_history,
                'submitted_at': datetime.now().isoformat()
            }

            return submission_data

        except Exception as e:
            raise Exception(f"Failed to prepare submission data: {str(e)}")

    def _combine_audio_chunks(self) -> bytes:
        """Combine all audio chunks into a single audio file"""
        try:
            # This is a simplified implementation
            # In a real system, you would properly decode and concatenate audio data
            combined_data = b''
            for chunk in self.recording_data:
                audio_bytes = base64.b64decode(chunk['data'])
                combined_data += audio_bytes
            return combined_data

        except Exception as e:
            raise Exception(f"Failed to combine audio chunks: {str(e)}")

    def get_current_duration(self) -> float:
        """Get current recording duration in seconds"""
        if self.start_time is None:
            return 0.0

        if self.current_state == RecordingState.PAUSED and self.pause_time:
            return self.pause_time - self.start_time - self.paused_duration
        elif self.current_state in [RecordingState.STOPPED, RecordingState.REVIEWING, RecordingState.SUBMITTED]:
            return self.total_duration
        else:
            return time.time() - self.start_time - self.paused_duration

    def get_state_info(self) -> Dict:
        """Get current state information"""
        return {
            'current_state': self.current_state.value,
            'recording_id': self.recording_id,
            'duration': self.get_current_duration(),
            'chunks_count': len(self.recording_data),
            'metadata': self.metadata,
            'error_message': self.error_message,
            'state_history': self.state_history.copy()
        }

    def _transition_to_state(self, new_state: RecordingState) -> None:
        """Transition to a new state"""
        old_state = self.current_state
        self.current_state = new_state

        transition_info = {
            'from_state': old_state.value,
            'to_state': new_state.value,
            'timestamp': datetime.now().isoformat(),
            'duration': self.get_current_duration()
        }

        self.state_history.append(transition_info)

    def reset(self) -> Dict:
        """Reset the recording state machine"""
        try:
            self.current_state = RecordingState.IDLE
            self.recording_id = None
            self.recording_data = []
            self.start_time = None
            self.pause_time = None
            self.total_duration = 0
            self.paused_duration = 0
            self.metadata = {}
            self.error_message = None
            self.state_history = []

            return {
                'status': 'success',
                'message': 'Recording state machine reset'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to reset recording state machine: {str(e)}'
            }


class AnswerValidator:
    """
    Validates answer submissions before processing.
    Checks format, size, content, and compliance with requirements.
    """

    def __init__(self):
        self.validation_rules = {
            AnswerType.AUDIO: {
                'max_file_size': 50 * 1024 * 1024,  # 50MB
                'min_duration': 5,  # 5 seconds
                'max_duration': 600,  # 10 minutes
                'allowed_formats': ['wav', 'mp3', 'webm'],
                'sample_rates': [16000, 22050, 44100, 48000]
            },
            AnswerType.CODE: {
                'max_file_size': 1024 * 1024,  # 1MB
                'min_lines': 1,
                'max_lines': 1000,
                'allowed_languages': ['python', 'javascript', 'java', 'cpp', 'c'],
                'max_file_count': 5
            },
            AnswerType.TEXT: {
                'max_file_size': 100 * 1024,  # 100KB
                'min_length': 1,
                'max_length': 50000,
                'allowed_formats': ['txt', 'md']
            }
        }

    def validate_answer(self, answer: Dict, question: Dict) -> Dict:
        """
        Validate an answer submission

        Args:
            answer: The answer to validate
            question: The question the answer is for

        Returns:
            Validation result
        """
        try:
            answer_type = answer.get('type')
            if answer_type not in self.validation_rules:
                return {
                    'result': ValidationResult.INVALID.value,
                    'errors': [f'Unsupported answer type: {answer_type}']
                }

            # Perform type-specific validation
            if answer_type == AnswerType.AUDIO.value:
                return self._validate_audio_answer(answer, question)
            elif answer_type == AnswerType.CODE.value:
                return self._validate_code_answer(answer, question)
            elif answer_type == AnswerType.TEXT.value:
                return self._validate_text_answer(answer, question)
            else:
                return {
                    'result': ValidationResult.INVALID.value,
                    'errors': [f'Validation not implemented for type: {answer_type}']
                }

        except Exception as e:
            return {
                'result': ValidationResult.INVALID.value,
                'errors': [f'Validation error: {str(e)}']
            }

    def _validate_audio_answer(self, answer: Dict, question: Dict) -> Dict:
        """Validate audio answer"""
        try:
            rules = self.validation_rules[AnswerType.AUDIO]
            errors = []
            warnings = []

            # Check required fields
            required_fields = ['duration', 'file_size', 'metadata']
            for field in required_fields:
                if field not in answer:
                    errors.append(f'Missing required field: {field}')

            # Validate file size
            file_size = answer.get('file_size', 0)
            if file_size > rules['max_file_size']:
                errors.append(f'File too large: {file_size} bytes (max: {rules["max_file_size"]} bytes)')
            elif file_size < 1024:  # Less than 1KB
                warnings.append('File seems very small, may be corrupted')

            # Validate duration
            duration = answer.get('duration', 0)
            if duration < rules['min_duration']:
                errors.append(f'Recording too short: {duration}s (min: {rules["min_duration"]}s)')
            elif duration > rules['max_duration']:
                errors.append(f'Recording too long: {duration}s (max: {rules["max_duration"]}s)')

            # Validate metadata
            metadata = answer.get('metadata', {})
            if 'sample_rate' in metadata:
                sample_rate = metadata['sample_rate']
                if sample_rate not in rules['sample_rates']:
                    warnings.append(f'Unusual sample rate: {sample_rate}Hz')

            # Validate against question requirements
            if question.get('type') == 'conversational':
                max_recording_time = question.get('maxRecordingTime', 120)
                if duration > max_recording_time:
                    errors.append(f'Recording exceeds question limit: {duration}s (max: {max_recording_time}s)')

            result = ValidationResult.VALID.value
            if errors:
                result = ValidationResult.INVALID.value
            elif warnings:
                result = ValidationResult.WARNING.value

            return {
                'result': result,
                'errors': errors,
                'warnings': warnings,
                'validation_details': {
                    'file_size': file_size,
                    'duration': duration,
                    'metadata': metadata
                }
            }

        except Exception as e:
            return {
                'result': ValidationResult.INVALID.value,
                'errors': [f'Audio validation error: {str(e)}']
            }

    def _validate_code_answer(self, answer: Dict, question: Dict) -> Dict:
        """Validate code answer"""
        try:
            rules = self.validation_rules[AnswerType.CODE]
            errors = []
            warnings = []

            # Check required fields
            required_fields = ['code', 'language']
            for field in required_fields:
                if field not in answer:
                    errors.append(f'Missing required field: {field}')

            # Validate code
            code = answer.get('code', '')
            if not code.strip():
                errors.append('Code cannot be empty')
            else:
                lines = code.split('\n')
                if len(lines) < rules['min_lines']:
                    errors.append(f'Code too short: {len(lines)} lines (min: {rules["min_lines"]} lines)')
                elif len(lines) > rules['max_lines']:
                    errors.append(f'Code too long: {len(lines)} lines (max: {rules["max_lines"]} lines)')

                # Check file size
                file_size = len(code.encode('utf-8'))
                if file_size > rules['max_file_size']:
                    errors.append(f'Code file too large: {file_size} bytes (max: {rules["max_file_size"]} bytes)')

            # Validate language
            language = answer.get('language')
            if language not in rules['allowed_languages']:
                errors.append(f'Unsupported language: {language} (allowed: {rules["allowed_languages"]})')

            # Validate against question requirements
            if question.get('type') == 'coding':
                required_language = question.get('requiredLanguage')
                if required_language and language != required_language:
                    errors.append(f'Language mismatch: {language} (required: {required_language})')

            # Basic syntax validation
            syntax_result = self._validate_code_syntax(code, language)
            if not syntax_result['valid']:
                warnings.extend(syntax_result['errors'])

            result = ValidationResult.VALID.value
            if errors:
                result = ValidationResult.INVALID.value
            elif warnings:
                result = ValidationResult.WARNING.value

            return {
                'result': result,
                'errors': errors,
                'warnings': warnings,
                'validation_details': {
                    'language': language,
                    'lines_count': len(lines),
                    'file_size': len(code.encode('utf-8')),
                    'syntax_valid': syntax_result['valid']
                }
            }

        except Exception as e:
            return {
                'result': ValidationResult.INVALID.value,
                'errors': [f'Code validation error: {str(e)}']
            }

    def _validate_text_answer(self, answer: Dict, question: Dict) -> Dict:
        """Validate text answer"""
        try:
            rules = self.validation_rules[AnswerType.TEXT]
            errors = []
            warnings = []

            # Check required fields
            if 'content' not in answer:
                errors.append('Missing required field: content')
            else:
                content = answer.get('content', '')
                content_length = len(content)

                if content_length < rules['min_length']:
                    errors.append(f'Text too short: {content_length} characters (min: {rules["min_length"]})')
                elif content_length > rules['max_length']:
                    errors.append(f'Text too long: {content_length} characters (max: {rules["max_length"]})')

                # Check file size
                file_size = len(content.encode('utf-8'))
                if file_size > rules['max_file_size']:
                    errors.append(f'Text file too large: {file_size} bytes (max: {rules["max_file_size"]} bytes)')

            result = ValidationResult.VALID.value
            if errors:
                result = ValidationResult.INVALID.value
            elif warnings:
                result = ValidationResult.WARNING.value

            return {
                'result': result,
                'errors': errors,
                'warnings': warnings,
                'validation_details': {
                    'content_length': content_length if 'content' in answer else 0,
                    'file_size': file_size if 'content' in answer else 0
                }
            }

        except Exception as e:
            return {
                'result': ValidationResult.INVALID.value,
                'errors': [f'Text validation error: {str(e)}']
            }

    def _validate_code_syntax(self, code: str, language: str) -> Dict:
        """Basic code syntax validation"""
        try:
            validation = {
                'valid': True,
                'errors': []
            }

            # This is a simplified syntax validation
            # In a real implementation, you would use language-specific parsers

            if language == 'python':
                # Basic Python syntax checks
                if 'def ' in code:
                    functions = [line.strip() for line in code.split('\n') if line.strip().startswith('def ')]
                    for func in functions:
                        if not func.endswith(':'):
                            validation['errors'].append(f'Function definition missing colon: {func}')

                # Check for unmatched parentheses, brackets, braces
                brackets = {'(': ')', '[': ']', '{': '}'}
                stack = []
                for char in code:
                    if char in brackets:
                        stack.append(char)
                    elif char in brackets.values():
                        if not stack:
                            validation['errors'].append(f'Unmatched closing bracket: {char}')
                        else:
                            opening = stack.pop()
                            if brackets[opening] != char:
                                validation['errors'].append(f'Mismatched brackets: {opening} and {char}')

                if stack:
                    validation['errors'].append(f'Unclosed brackets: {stack}')

            elif language == 'javascript':
                # Basic JavaScript syntax checks
                if code.count('{') != code.count('}'):
                    validation['errors'].append('Unmatched braces')
                if code.count('(') != code.count(')'):
                    validation['errors'].append('Unmatched parentheses')

            if validation['errors']:
                validation['valid'] = False

            return validation

        except Exception as e:
            return {
                'valid': False,
                'errors': [f'Syntax validation error: {str(e)}']
            }


class SubmissionAPI:
    """
    Handles secure answer submission with encryption,
    integrity checking, and transmission protocols.
    """

    def __init__(self):
        self.submission_queue = []
        self.submission_history = []
        self.encryption_enabled = True
        self.compression_enabled = True
        self.max_retries = 3
        self.retry_delay = 1  # seconds

    def submit_answer(self, answer: Dict, validation_result: Dict = None) -> Dict:
        """
        Submit an answer with validation and security checks

        Args:
            answer: The answer to submit
            validation_result: Optional pre-validation result

        Returns:
            Submission status
        """
        try:
            submission_id = str(uuid.uuid4())

            # Validate answer if not pre-validated
            if validation_result is None:
                validator = AnswerValidator()
                validation_result = validator.validate_answer(answer, {})

            if validation_result['result'] == ValidationResult.INVALID.value:
                return {
                    'status': 'error',
                    'message': 'Answer validation failed',
                    'submission_id': submission_id,
                    'validation_errors': validation_result['errors']
                }

            # Prepare submission package
            submission_package = self._prepare_submission_package(answer, validation_result, submission_id)

            # Add to submission queue
            self.submission_queue.append(submission_package)

            # Process submission
            result = self._process_submission(submission_package)

            # Move to history
            self.submission_history.append({
                'submission_id': submission_id,
                'timestamp': datetime.now().isoformat(),
                'result': result,
                'answer_type': answer.get('type'),
                'file_size': answer.get('file_size', 0)
            })

            return {
                'status': 'success',
                'message': 'Answer submitted successfully',
                'submission_id': submission_id,
                'result': result
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Submission failed: {str(e)}',
                'submission_id': submission_id if 'submission_id' in locals() else None
            }

    def _prepare_submission_package(self, answer: Dict, validation_result: Dict, submission_id: str) -> Dict:
        """Prepare answer for submission with security measures"""
        try:
            package = {
                'submission_id': submission_id,
                'answer_data': answer,
                'validation_result': validation_result,
                'timestamp': datetime.now().isoformat(),
                'security': {
                    'encrypted': self.encryption_enabled,
                    'compressed': self.compression_enabled,
                    'checksum': None
                }
            }

            # Calculate checksum
            answer_json = json.dumps(answer, sort_keys=True)
            package['security']['checksum'] = hashlib.sha256(answer_json.encode()).hexdigest()

            # Apply compression if enabled
            if self.compression_enabled:
                package['answer_data'] = self._compress_data(answer)

            # Apply encryption if enabled
            if self.encryption_enabled:
                package = self._encrypt_package(package)

            return package

        except Exception as e:
            raise Exception(f"Failed to prepare submission package: {str(e)}")

    def _process_submission(self, package: Dict) -> Dict:
        """Process the submission package"""
        try:
            # Decrypt if needed
            if package.get('security', {}).get('encrypted'):
                package = self._decrypt_package(package)

            # Decompress if needed
            if package.get('security', {}).get('compressed'):
                package['answer_data'] = self._decompress_data(package['answer_data'])

            # Verify integrity
            integrity_check = self._verify_integrity(package)
            if not integrity_check['valid']:
                return {
                    'status': 'error',
                    'message': 'Integrity check failed',
                    'details': integrity_check
                }

            # Simulate transmission and storage
            transmission_result = self._simulate_transmission(package)

            return {
                'status': 'success',
                'message': 'Submission processed successfully',
                'transmission_result': transmission_result,
                'stored_at': datetime.now().isoformat()
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Processing failed: {str(e)}'
            }

    def _compress_data(self, data: Dict) -> Dict:
        """Compress data (simplified implementation)"""
        # In a real implementation, you would use proper compression algorithms
        return {
            'compressed': True,
            'original_size': len(json.dumps(data).encode()),
            'data': data  # Placeholder for compressed data
        }

    def _decompress_data(self, compressed_data: Dict) -> Dict:
        """Decompress data (simplified implementation)"""
        # In a real implementation, you would decompress the data
        return compressed_data['data']

    def _encrypt_package(self, package: Dict) -> Dict:
        """Encrypt package (simplified implementation)"""
        # In a real implementation, you would use proper encryption
        package['security']['encrypted'] = True
        return package

    def _decrypt_package(self, package: Dict) -> Dict:
        """Decrypt package (simplified implementation)"""
        # In a real implementation, you would decrypt the data
        package['security']['encrypted'] = False
        return package

    def _verify_integrity(self, package: Dict) -> Dict:
        """Verify package integrity"""
        try:
            expected_checksum = package.get('security', {}).get('checksum')
            if not expected_checksum:
                return {'valid': False, 'error': 'Missing checksum'}

            answer_data = package['answer_data']
            answer_json = json.dumps(answer_data, sort_keys=True)
            actual_checksum = hashlib.sha256(answer_json.encode()).hexdigest()

            return {
                'valid': expected_checksum == actual_checksum,
                'expected_checksum': expected_checksum,
                'actual_checksum': actual_checksum
            }

        except Exception as e:
            return {'valid': False, 'error': str(e)}

    def _simulate_transmission(self, package: Dict) -> Dict:
        """Simulate data transmission"""
        try:
            # Simulate network delay
            transmission_time = 0.1 + (len(json.dumps(package)) / 1000000)  # Simulated delay
            time.sleep(transmission_time)

            # Simulate success with small failure chance
            import random
            if random.random() < 0.05:  # 5% failure rate
                return {
                    'success': False,
                    'error': 'Simulated transmission failure',
                    'transmission_time': transmission_time
                }

            return {
                'success': True,
                'transmission_time': transmission_time,
                'data_size': len(json.dumps(package))
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_submission_status(self, submission_id: str) -> Dict:
        """Get status of a submission"""
        try:
            # Check in history
            for submission in self.submission_history:
                if submission['submission_id'] == submission_id:
                    return {
                        'status': 'found',
                        'submission': submission
                    }

            # Check in queue
            for submission in self.submission_queue:
                if submission['submission_id'] == submission_id:
                    return {
                        'status': 'pending',
                        'submission': submission
                    }

            return {
                'status': 'not_found',
                'message': f'Submission {submission_id} not found'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to get submission status: {str(e)}'
            }

    def get_submission_history(self) -> Dict:
        """Get submission history"""
        try:
            return {
                'status': 'success',
                'history': self.submission_history.copy(),
                'total_submissions': len(self.submission_history),
                'queue_size': len(self.submission_queue)
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to get submission history: {str(e)}'
            }


class AudioVisualizer:
    """
    Provides real-time audio visualization data for recording feedback.
    Generates waveform and frequency analysis data.
    """

    def __init__(self):
        self.visualization_data = []
        self.sample_rate = 16000
        self.window_size = 1024
        self.update_rate = 10  # Hz

    def process_audio_chunk(self, audio_data: str, chunk_metadata: Dict = None) -> Dict:
        """
        Process audio chunk and generate visualization data

        Args:
            audio_data: Base64 encoded audio data
            chunk_metadata: Optional metadata for the chunk

        Returns:
            Visualization data
        """
        try:
            # Decode audio data
            decoded_audio = base64.b64decode(audio_data)
            if len(decoded_audio) == 0:
                return {
                    'status': 'error',
                    'message': 'Empty audio data'
                }

            # Generate waveform data
            waveform_data = self._generate_waveform_data(decoded_audio)

            # Generate frequency spectrum data
            spectrum_data = self._generate_spectrum_data(decoded_audio)

            # Calculate volume levels
            volume_data = self._calculate_volume_levels(decoded_audio)

            visualization_info = {
                'timestamp': time.time(),
                'chunk_size': len(decoded_audio),
                'waveform': waveform_data,
                'spectrum': spectrum_data,
                'volume': volume_data,
                'metadata': chunk_metadata or {}
            }

            self.visualization_data.append(visualization_info)

            # Keep only recent data (last 10 seconds)
            current_time = time.time()
            self.visualization_data = [
                v for v in self.visualization_data
                if current_time - v['timestamp'] < 10
            ]

            return {
                'status': 'success',
                'visualization_data': visualization_info
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to process audio chunk: {str(e)}'
            }

    def _generate_waveform_data(self, audio_data: bytes) -> Dict:
        """Generate waveform visualization data"""
        try:
            # Convert bytes to samples (simplified - assumes 16-bit PCM)
            import struct
            samples = []
            for i in range(0, len(audio_data), 2):
                if i + 1 < len(audio_data):
                    sample = struct.unpack('<h', audio_data[i:i+2])[0]
                    samples.append(sample)

            if not samples:
                return {'amplitudes': [], 'peaks': []}

            # Downsample for visualization
            target_points = 100
            if len(samples) > target_points:
                step = len(samples) // target_points
                downsampled = [max(samples[i:i+step]) for i in range(0, len(samples), step)]
            else:
                downsampled = samples

            # Normalize to -1 to 1 range
            max_val = max(abs(min(downsampled)), abs(max(downsampled)))
            if max_val > 0:
                normalized = [s / max_val for s in downsampled]
            else:
                normalized = downsampled

            return {
                'amplitudes': normalized[:100],
                'peaks': {
                    'positive': max(normalized) if normalized else 0,
                    'negative': min(normalized) if normalized else 0
                }
            }

        except Exception as e:
            print(f"Error generating waveform data: {e}")
            return {'amplitudes': [], 'peaks': []}

    def _generate_spectrum_data(self, audio_data: bytes) -> Dict:
        """Generate frequency spectrum visualization data"""
        try:
            # Convert to samples (simplified)
            import struct
            samples = []
            for i in range(0, len(audio_data), 2):
                if i + 1 < len(audio_data):
                    sample = struct.unpack('<h', audio_data[i:i+2])[0]
                    samples.append(sample)

            if not samples:
                return {'frequencies': [], 'magnitudes': []}

            # Simple FFT approximation (simplified for demonstration)
            # In a real implementation, you would use numpy.fft or similar
            import math

            n = min(512, len(samples))  # Use first 512 samples
            frequencies = []
            magnitudes = []

            # Generate simple frequency bins
            for k in range(32):  # 32 frequency bins
                freq = (k * self.sample_rate) / (2 * 32)
                frequencies.append(freq)

                # Simple magnitude calculation (very simplified)
                magnitude = 0
                for i in range(n):
                    angle = 2 * math.pi * k * i / n
                    magnitude += samples[i] * math.cos(angle)

                magnitudes.append(abs(magnitude) / n)

            # Normalize magnitudes
            max_mag = max(magnitudes) if magnitudes else 1
            if max_mag > 0:
                magnitudes = [m / max_mag for m in magnitudes]

            return {
                'frequencies': frequencies,
                'magnitudes': magnitudes
            }

        except Exception as e:
            print(f"Error generating spectrum data: {e}")
            return {'frequencies': [], 'magnitudes': []}

    def _calculate_volume_levels(self, audio_data: bytes) -> Dict:
        """Calculate volume levels from audio data"""
        try:
            # Convert to samples
            import struct
            samples = []
            for i in range(0, len(audio_data), 2):
                if i + 1 < len(audio_data):
                    sample = struct.unpack('<h', audio_data[i:i+2])[0]
                    samples.append(sample)

            if not samples:
                return {'rms': 0, 'peak': 0, 'average': 0}

            # Calculate RMS
            sum_squares = sum(s * s for s in samples)
            rms = math.sqrt(sum_squares / len(samples))

            # Calculate peak
            peak = max(abs(s) for s in samples)

            # Calculate average
            average = sum(abs(s) for s in samples) / len(samples)

            # Normalize to 0-1 range (assuming 16-bit audio)
            max_sample = 32768
            return {
                'rms': rms / max_sample,
                'peak': peak / max_sample,
                'average': average / max_sample,
                'normalized': True
            }

        except Exception as e:
            print(f"Error calculating volume levels: {e}")
            return {'rms': 0, 'peak': 0, 'average': 0}

    def get_current_visualization(self) -> Dict:
        """Get current visualization state"""
        try:
            if not self.visualization_data:
                return {
                    'status': 'no_data',
                    'message': 'No visualization data available'
                }

            latest_data = self.visualization_data[-1]

            # Combine recent data for smooth visualization
            recent_data = self.visualization_data[-5:]  # Last 5 chunks

            return {
                'status': 'success',
                'current_data': latest_data,
                'recent_data': recent_data,
                'total_chunks': len(self.visualization_data)
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to get visualization data: {str(e)}'
            }

    def clear_visualization_data(self) -> Dict:
        """Clear all visualization data"""
        try:
            self.visualization_data.clear()
            return {
                'status': 'success',
                'message': 'Visualization data cleared'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to clear visualization data: {str(e)}'
            }