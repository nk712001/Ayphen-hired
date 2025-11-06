"""
Question Engine for AI-Powered Test Monitoring Platform

This module handles question sequencing, type management, timer systems,
and state management for the interview flow. Supports smooth transitions
between conversational and coding questions.
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
import uuid


class QuestionType(Enum):
    """Enumeration of supported question types"""
    CONVERSATIONAL = "conversational"
    CODING = "coding"


class QuestionState(Enum):
    """Enumeration of question states"""
    NOT_STARTED = "not_started"
    INSTRUCTIONS = "instructions"
    THINKING = "thinking"
    RECORDING = "recording"
    REVIEW = "review"
    SUBMITTED = "submitted"
    SKIPPED = "skipped"


class TimerState(Enum):
    """Enumeration of timer states"""
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"
    EXPIRED = "expired"


class QuestionSequencer:
    """
    Manages question sequencing and flow for interviews.
    Handles the order, timing, and transitions between questions.
    """

    def __init__(self):
        self.question_sequence = []
        self.current_index = -1
        self.current_question = None
        self.test_config = {}
        self.session_id = str(uuid.uuid4())
        self.start_time = None
        self.end_time = None

    def load_test_configuration(self, test_config: Dict) -> Dict:
        """
        Load test configuration and initialize question sequence

        Args:
            test_config: Dictionary containing test configuration including questions

        Returns:
            Status of the loading operation
        """
        try:
            self.test_config = test_config
            self.question_sequence = test_config.get('questions', [])
            self.current_index = -1
            self.current_question = None
            self.start_time = None
            self.end_time = None

            # Validate question structure
            validation_result = self._validate_question_sequence()
            if not validation_result['valid']:
                return {
                    'status': 'error',
                    'message': validation_result['error'],
                    'details': validation_result['details']
                }

            return {
                'status': 'success',
                'message': 'Test configuration loaded successfully',
                'total_questions': len(self.question_sequence),
                'estimated_duration': self._calculate_estimated_duration(),
                'session_id': self.session_id
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to load test configuration: {str(e)}'
            }

    def _validate_question_sequence(self) -> Dict:
        """Validate the structure and content of the question sequence"""
        validation = {
            'valid': True,
            'error': None,
            'details': []
        }

        try:
            if not self.question_sequence:
                validation['valid'] = False
                validation['error'] = 'No questions provided'
                return validation

            required_fields = ['id', 'type', 'text', 'order']
            for i, question in enumerate(self.question_sequence):
                # Check required fields
                missing_fields = [field for field in required_fields if field not in question]
                if missing_fields:
                    validation['details'].append(f'Question {i+1}: Missing fields {missing_fields}')

                # Validate question type
                if 'type' in question:
                    try:
                        QuestionType(question['type'])
                    except ValueError:
                        validation['details'].append(f'Question {i+1}: Invalid question type "{question["type"]}"')

                # Validate conversational question specifics
                if question.get('type') == 'conversational':
                    if 'timeToStart' not in question:
                        validation['details'].append(f'Conversational question {i+1}: Missing timeToStart field')
                    elif not isinstance(question['timeToStart'], int) or question['timeToStart'] < 0:
                        validation['details'].append(f'Conversational question {i+1}: Invalid timeToStart value')

                # Validate coding question specifics
                if question.get('type') == 'coding':
                    if 'timeLimit' not in question:
                        validation['details'].append(f'Coding question {i+1}: Missing timeLimit field')
                    elif not isinstance(question['timeLimit'], int) or question['timeLimit'] <= 0:
                        validation['details'].append(f'Coding question {i+1}: Invalid timeLimit value')

            # Check for unique orders
            orders = [q.get('order', i) for i, q in enumerate(self.question_sequence)]
            if len(orders) != len(set(orders)):
                validation['details'].append('Question orders must be unique')

            # Check for proper sequencing
            orders.sort()
            expected_orders = list(range(len(self.question_sequence)))
            if orders != expected_orders:
                validation['details'].append('Question orders should be sequential starting from 0')

            if validation['details']:
                validation['valid'] = False
                validation['error'] = 'Question sequence validation failed'

            return validation

        except Exception as e:
            validation['valid'] = False
            validation['error'] = f'Validation error: {str(e)}'
            return validation

    def _calculate_estimated_duration(self) -> int:
        """Calculate estimated total duration in minutes"""
        total_duration = 0

        for question in self.question_sequence:
            if question.get('type') == 'conversational':
                # Conversational questions: thinking time + recording time
                thinking_time = 30  # Default 30 seconds thinking
                recording_time = 120  # Default 2 minutes recording
                total_duration += (thinking_time + recording_time) // 60
            elif question.get('type') == 'coding':
                # Coding questions use timeLimit
                time_limit = question.get('timeLimit', 30)  # Default 30 minutes
                total_duration += time_limit

        return total_duration

    def start_test(self) -> Dict:
        """Start the test and initialize the first question"""
        try:
            if self.start_time is not None:
                return {
                    'status': 'error',
                    'message': 'Test already started'
                }

            if not self.question_sequence:
                return {
                    'status': 'error',
                    'message': 'No questions loaded'
                }

            self.start_time = datetime.now()
            self.current_index = 0
            self.current_question = self.question_sequence[0]

            return {
                'status': 'success',
                'message': 'Test started successfully',
                'session_id': self.session_id,
                'start_time': self.start_time.isoformat(),
                'first_question': self._prepare_question_for_client(self.current_question),
                'total_questions': len(self.question_sequence)
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to start test: {str(e)}'
            }

    def get_next_question(self) -> Dict:
        """Move to the next question in the sequence"""
        try:
            if self.current_index >= len(self.question_sequence) - 1:
                return {
                    'status': 'completed',
                    'message': 'All questions completed',
                    'test_summary': self._generate_test_summary()
                }

            self.current_index += 1
            self.current_question = self.question_sequence[self.current_index]

            return {
                'status': 'success',
                'message': 'Next question loaded',
                'question': self._prepare_question_for_client(self.current_question),
                'question_number': self.current_index + 1,
                'total_questions': len(self.question_sequence),
                'remaining_questions': len(self.question_sequence) - self.current_index - 1
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to get next question: {str(e)}'
            }

    def get_current_question(self) -> Dict:
        """Get the current question information"""
        try:
            if self.current_question is None:
                return {
                    'status': 'error',
                    'message': 'No current question'
                }

            return {
                'status': 'success',
                'question': self._prepare_question_for_client(self.current_question),
                'question_number': self.current_index + 1,
                'total_questions': len(self.question_sequence),
                'time_remaining': self._get_time_remaining()
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to get current question: {str(e)}'
            }

    def _prepare_question_for_client(self, question: Dict) -> Dict:
        """Prepare question data for client consumption"""
        client_question = {
            'id': question['id'],
            'type': question['type'],
            'text': question['text'],
            'order': question['order']
        }

        # Add type-specific fields
        if question.get('type') == 'conversational':
            client_question['timeToStart'] = question.get('timeToStart', 30)
            client_question['maxRecordingTime'] = 120  # 2 minutes default
        elif question.get('type') == 'coding':
            client_question['timeLimit'] = question.get('timeLimit', 30)
            client_question['languages'] = question.get('languages', ['python', 'javascript'])
            client_question['testCases'] = question.get('testCases', [])

        # Add optional fields
        if 'difficulty' in question:
            client_question['difficulty'] = question['difficulty']
        if 'hints' in question:
            client_question['hints'] = question['hints']

        return client_question

    def _get_time_remaining(self) -> Optional[int]:
        """Get time remaining for current question in seconds"""
        if self.current_question is None:
            return None

        if self.current_question.get('type') == 'coding':
            # For coding questions, this would be calculated based on start time
            # This is a simplified implementation
            return None  # Timer handled by TimerSystem
        else:
            return None

    def _generate_test_summary(self) -> Dict:
        """Generate a summary of the completed test"""
        if self.start_time is None:
            return {'error': 'Test not started'}

        end_time = datetime.now()
        duration = end_time - self.start_time

        return {
            'session_id': self.session_id,
            'start_time': self.start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_minutes': int(duration.total_seconds() // 60),
            'total_questions': len(self.question_sequence),
            'completed_questions': self.current_index + 1
        }

    def skip_question(self) -> Dict:
        """Skip the current question"""
        try:
            if self.current_question is None:
                return {
                    'status': 'error',
                    'message': 'No current question to skip'
                }

            # Mark current question as skipped
            self.current_question['state'] = QuestionState.SKIPPED.value
            self.current_question['skipped_at'] = datetime.now().isoformat()

            # Move to next question
            return self.get_next_question()

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to skip question: {str(e)}'
            }

    def go_to_question(self, question_index: int) -> Dict:
        """Navigate to a specific question by index"""
        try:
            if question_index < 0 or question_index >= len(self.question_sequence):
                return {
                    'status': 'error',
                    'message': f'Invalid question index: {question_index}'
                }

            self.current_index = question_index
            self.current_question = self.question_sequence[question_index]

            return {
                'status': 'success',
                'message': f'Navigated to question {question_index + 1}',
                'question': self._prepare_question_for_client(self.current_question),
                'question_number': self.current_index + 1
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to navigate to question: {str(e)}'
            }


class QuestionTypeManager:
    """
    Manages different question types and their specific behaviors.
    Handles conversational vs coding question interfaces and logic.
    """

    def __init__(self):
        self.supported_types = [qt.value for qt in QuestionType]
        self.question_configs = {}

    def register_question_type(self, question_type: str, config: Dict) -> Dict:
        """
        Register configuration for a specific question type

        Args:
            question_type: Type of question
            config: Configuration object for the question type

        Returns:
            Status of registration
        """
        try:
            if question_type not in self.supported_types:
                return {
                    'status': 'error',
                    'message': f'Unsupported question type: {question_type}'
                }

            # Validate configuration
            validation_result = self._validate_type_config(question_type, config)
            if not validation_result['valid']:
                return {
                    'status': 'error',
                    'message': f'Invalid configuration for {question_type}',
                    'details': validation_result['errors']
                }

            self.question_configs[question_type] = config

            return {
                'status': 'success',
                'message': f'Configuration registered for {question_type}'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to register question type: {str(e)}'
            }

    def _validate_type_config(self, question_type: str, config: Dict) -> Dict:
        """Validate configuration for a specific question type"""
        validation = {
            'valid': True,
            'errors': []
        }

        try:
            if question_type == 'conversational':
                required_fields = ['max_recording_time', 'thinking_time', 'allowed_extensions']
                for field in required_fields:
                    if field not in config:
                        validation['errors'].append(f'Missing required field: {field}')

                # Validate numeric values
                if 'max_recording_time' in config and not isinstance(config['max_recording_time'], int):
                    validation['errors'].append('max_recording_time must be an integer')
                if 'thinking_time' in config and not isinstance(config['thinking_time'], int):
                    validation['errors'].append('thinking_time must be an integer')

            elif question_type == 'coding':
                required_fields = ['default_time_limit', 'supported_languages', 'code_execution']
                for field in required_fields:
                    if field not in config:
                        validation['errors'].append(f'Missing required field: {field}')

                # Validate supported languages
                if 'supported_languages' in config and not isinstance(config['supported_languages'], list):
                    validation['errors'].append('supported_languages must be a list')

            if validation['errors']:
                validation['valid'] = False

            return validation

        except Exception as e:
            validation['valid'] = False
            validation['errors'].append(f'Validation error: {str(e)}')
            return validation

    def get_question_config(self, question_type: str) -> Dict:
        """Get configuration for a specific question type"""
        return self.question_configs.get(question_type, {})

    def get_supported_types(self) -> List[str]:
        """Get list of supported question types"""
        return self.supported_types.copy()

    def process_question_submission(self, question: Dict, answer_data: Dict) -> Dict:
        """
        Process answer submission based on question type

        Args:
            question: The question object
            answer_data: The submitted answer data

        Returns:
            Processing result
        """
        try:
            question_type = question.get('type')
            if question_type not in self.supported_types:
                return {
                    'status': 'error',
                    'message': f'Unsupported question type: {question_type}'
                }

            if question_type == 'conversational':
                return self._process_conversational_answer(question, answer_data)
            elif question_type == 'coding':
                return self._process_coding_answer(question, answer_data)
            else:
                return {
                    'status': 'error',
                    'message': f'Processing not implemented for type: {question_type}'
                }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to process answer: {str(e)}'
            }

    def _process_conversational_answer(self, question: Dict, answer_data: Dict) -> Dict:
        """Process conversational question answer"""
        try:
            required_fields = ['audio_data', 'duration']
            for field in required_fields:
                if field not in answer_data:
                    return {
                        'status': 'error',
                        'message': f'Missing required field: {field}'
                    }

            config = self.get_question_config('conversational')
            max_duration = config.get('max_recording_time', 120)

            # Validate duration
            duration = answer_data.get('duration', 0)
            if duration > max_duration:
                return {
                    'status': 'error',
                    'message': f'Recording exceeds maximum duration of {max_duration} seconds'
                }

            # Validate audio data (simplified)
            audio_data = answer_data.get('audio_data', '')
            if not audio_data:
                return {
                    'status': 'error',
                    'message': 'No audio data provided'
                }

            return {
                'status': 'success',
                'message': 'Conversational answer processed successfully',
                'answer_id': str(uuid.uuid4()),
                'type': 'audio',
                'duration': duration,
                'file_size': len(audio_data),
                'metadata': {
                    'question_id': question.get('id'),
                    'question_type': 'conversational',
                    'submitted_at': datetime.now().isoformat()
                }
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to process conversational answer: {str(e)}'
            }

    def _process_coding_answer(self, question: Dict, answer_data: Dict) -> Dict:
        """Process coding question answer"""
        try:
            required_fields = ['code', 'language']
            for field in required_fields:
                if field not in answer_data:
                    return {
                        'status': 'error',
                        'message': f'Missing required field: {field}'
                    }

            config = self.get_question_config('coding')
            supported_languages = config.get('supported_languages', ['python', 'javascript'])

            # Validate language
            language = answer_data.get('language')
            if language not in supported_languages:
                return {
                    'status': 'error',
                    'message': f'Unsupported language: {language}. Supported: {supported_languages}'
                }

            # Validate code
            code = answer_data.get('code', '')
            if not code.strip():
                return {
                    'status': 'error',
                    'message': 'Code cannot be empty'
                }

            # Basic syntax validation (simplified)
            syntax_validation = self._validate_code_syntax(code, language)
            if not syntax_validation['valid']:
                return {
                    'status': 'warning',
                    'message': 'Code has syntax issues but will be submitted',
                    'syntax_errors': syntax_validation['errors']
                }

            return {
                'status': 'success',
                'message': 'Coding answer processed successfully',
                'answer_id': str(uuid.uuid4()),
                'type': 'code',
                'language': language,
                'code_length': len(code),
                'metadata': {
                    'question_id': question.get('id'),
                    'question_type': 'coding',
                    'submitted_at': datetime.now().isoformat(),
                    'syntax_valid': syntax_validation['valid']
                }
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to process coding answer: {str(e)}'
            }

    def _validate_code_syntax(self, code: str, language: str) -> Dict:
        """Basic code syntax validation (simplified implementation)"""
        validation = {
            'valid': True,
            'errors': []
        }

        try:
            # This is a very basic syntax validation
            # In a real implementation, you would use language-specific parsers or linters

            if language == 'python':
                # Basic Python syntax checks
                if 'def ' in code and ':' not in code.split('def ')[1].split('\n')[0]:
                    validation['errors'].append('Function definition missing colon')
                if 'if ' in code or 'for ' in code or 'while ' in code:
                    # Check for indentation and colons
                    lines = code.split('\n')
                    for line in lines:
                        if any(keyword in line for keyword in ['if ', 'for ', 'while ', 'def ', 'class ']):
                            if not line.strip().endswith(':'):
                                validation['errors'].append(f'Missing colon in line: {line.strip()}')

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
            validation['valid'] = False
            validation['errors'].append(f'Syntax validation error: {str(e)}')
            return validation


class TimerSystem:
    """
    Manages timing and countdown for questions.
    Handles thinking time, recording time, and overall test timing.
    """

    def __init__(self):
        self.timers = {}
        self.timer_callbacks = {}

    def create_timer(self, timer_id: str, duration_seconds: int, callback=None) -> Dict:
        """
        Create a new timer

        Args:
            timer_id: Unique identifier for the timer
            duration_seconds: Duration in seconds
            callback: Optional callback function when timer expires

        Returns:
            Status of timer creation
        """
        try:
            if timer_id in self.timers:
                return {
                    'status': 'error',
                    'message': f'Timer {timer_id} already exists'
                }

            if duration_seconds <= 0:
                return {
                    'status': 'error',
                    'message': 'Duration must be positive'
                }

            timer = {
                'id': timer_id,
                'duration': duration_seconds,
                'remaining': duration_seconds,
                'state': TimerState.STOPPED.value,
                'start_time': None,
                'pause_time': None,
                'callback': callback
            }

            self.timers[timer_id] = timer

            return {
                'status': 'success',
                'message': f'Timer {timer_id} created',
                'timer_id': timer_id,
                'duration': duration_seconds
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to create timer: {str(e)}'
            }

    def start_timer(self, timer_id: str) -> Dict:
        """Start a timer"""
        try:
            if timer_id not in self.timers:
                return {
                    'status': 'error',
                    'message': f'Timer {timer_id} not found'
                }

            timer = self.timers[timer_id]
            if timer['state'] == TimerState.RUNNING.value:
                return {
                    'status': 'warning',
                    'message': f'Timer {timer_id} already running'
                }

            now = time.time()
            if timer['state'] == TimerState.PAUSED.value:
                # Resume from pause
                pause_duration = now - timer['pause_time']
                timer['start_time'] += pause_duration
            else:
                # Start fresh
                timer['start_time'] = now
                timer['remaining'] = timer['duration']

            timer['state'] = TimerState.RUNNING.value
            timer['pause_time'] = None

            return {
                'status': 'success',
                'message': f'Timer {timer_id} started',
                'remaining': timer['remaining']
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to start timer: {str(e)}'
            }

    def pause_timer(self, timer_id: str) -> Dict:
        """Pause a running timer"""
        try:
            if timer_id not in self.timers:
                return {
                    'status': 'error',
                    'message': f'Timer {timer_id} not found'
                }

            timer = self.timers[timer_id]
            if timer['state'] != TimerState.RUNNING.value:
                return {
                    'status': 'warning',
                    'message': f'Timer {timer_id} is not running'
                }

            now = time.time()
            elapsed = now - timer['start_time']
            timer['remaining'] = max(0, timer['remaining'] - elapsed)
            timer['state'] = TimerState.PAUSED.value
            timer['pause_time'] = now

            return {
                'status': 'success',
                'message': f'Timer {timer_id} paused',
                'remaining': timer['remaining']
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to pause timer: {str(e)}'
            }

    def stop_timer(self, timer_id: str) -> Dict:
        """Stop a timer"""
        try:
            if timer_id not in self.timers:
                return {
                    'status': 'error',
                    'message': f'Timer {timer_id} not found'
                }

            timer = self.timers[timer_id]

            if timer['state'] == TimerState.RUNNING.value:
                now = time.time()
                elapsed = now - timer['start_time']
                timer['remaining'] = max(0, timer['remaining'] - elapsed)

            timer['state'] = TimerState.STOPPED.value

            return {
                'status': 'success',
                'message': f'Timer {timer_id} stopped',
                'remaining': timer['remaining']
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to stop timer: {str(e)}'
            }

    def get_timer_status(self, timer_id: str) -> Dict:
        """Get current status of a timer"""
        try:
            if timer_id not in self.timers:
                return {
                    'status': 'error',
                    'message': f'Timer {timer_id} not found'
                }

            timer = self.timers[timer_id]
            remaining = timer['remaining']

            if timer['state'] == TimerState.RUNNING.value:
                now = time.time()
                elapsed = now - timer['start_time']
                remaining = max(0, timer['remaining'] - elapsed)

                if remaining == 0:
                    timer['state'] = TimerState.EXPIRED.value
                    if timer['callback']:
                        timer['callback'](timer_id)

            return {
                'status': 'success',
                'timer_id': timer_id,
                'state': timer['state'],
                'remaining': remaining,
                'duration': timer['duration'],
                'percentage': ((timer['duration'] - remaining) / timer['duration']) * 100 if timer['duration'] > 0 else 0
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to get timer status: {str(e)}'
            }

    def delete_timer(self, timer_id: str) -> Dict:
        """Delete a timer"""
        try:
            if timer_id not in self.timers:
                return {
                    'status': 'error',
                    'message': f'Timer {timer_id} not found'
                }

            del self.timers[timer_id]

            return {
                'status': 'success',
                'message': f'Timer {timer_id} deleted'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to delete timer: {str(e)}'
            }

    def get_all_timers(self) -> Dict:
        """Get status of all timers"""
        try:
            all_timers = {}
            for timer_id in self.timers:
                all_timers[timer_id] = self.get_timer_status(timer_id)

            return {
                'status': 'success',
                'timers': all_timers,
                'total_timers': len(self.timers)
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to get all timers: {str(e)}'
            }


class StateManager:
    """
    Manages interview state and progress tracking.
    Handles question states, user progress, and session management.
    """

    def __init__(self):
        self.session_state = {
            'session_id': None,
            'test_id': None,
            'candidate_id': None,
            'start_time': None,
            'current_question_index': -1,
            'questions_state': {},
            'overall_progress': 0.0,
            'time_spent': 0,
            'violations': [],
            'status': 'not_started'
        }

    def initialize_session(self, session_config: Dict) -> Dict:
        """
        Initialize a new interview session

        Args:
            session_config: Configuration for the session

        Returns:
            Status of initialization
        """
        try:
            required_fields = ['session_id', 'test_id', 'candidate_id']
            for field in required_fields:
                if field not in session_config:
                    return {
                        'status': 'error',
                        'message': f'Missing required field: {field}'
                    }

            self.session_state.update({
                'session_id': session_config['session_id'],
                'test_id': session_config['test_id'],
                'candidate_id': session_config['candidate_id'],
                'start_time': datetime.now().isoformat(),
                'current_question_index': 0,
                'questions_state': {},
                'overall_progress': 0.0,
                'time_spent': 0,
                'violations': [],
                'status': 'initialized'
            })

            return {
                'status': 'success',
                'message': 'Session initialized successfully',
                'session_id': self.session_state['session_id']
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to initialize session: {str(e)}'
            }

    def update_question_state(self, question_id: str, state: str, metadata: Dict = None) -> Dict:
        """
        Update state for a specific question

        Args:
            question_id: ID of the question
            state: New state for the question
            metadata: Optional metadata about the state change

        Returns:
            Status of the update
        """
        try:
            valid_states = [qs.value for qs in QuestionState]
            if state not in valid_states:
                return {
                    'status': 'error',
                    'message': f'Invalid state: {state}',
                    'valid_states': valid_states
                }

            if question_id not in self.session_state['questions_state']:
                self.session_state['questions_state'][question_id] = {
                    'states': [],
                    'current_state': None,
                    'timestamps': {}
                }

            question_state = self.session_state['questions_state'][question_id]
            now = datetime.now().isoformat()

            question_state['states'].append(state)
            question_state['current_state'] = state
            question_state['timestamps'][state] = now

            if metadata:
                question_state[f'{state}_metadata'] = metadata

            # Update overall progress
            self._recalculate_progress()

            return {
                'status': 'success',
                'message': f'Question {question_id} state updated to {state}',
                'timestamp': now,
                'overall_progress': self.session_state['overall_progress']
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to update question state: {str(e)}'
            }

    def _recalculate_progress(self) -> None:
        """Recalculate overall progress based on question states"""
        try:
            total_questions = len(self.session_state['questions_state'])
            if total_questions == 0:
                self.session_state['overall_progress'] = 0.0
                return

            completed_questions = 0
            for question_id, question_state in self.session_state['questions_state'].items():
                current_state = question_state.get('current_state')
                if current_state in [QuestionState.SUBMITTED.value, QuestionState.SKIPPED.value]:
                    completed_questions += 1

            self.session_state['overall_progress'] = (completed_questions / total_questions) * 100

        except Exception as e:
            print(f"Error recalculating progress: {e}")

    def get_session_state(self) -> Dict:
        """Get current session state"""
        return {
            'status': 'success',
            'session_state': self.session_state.copy()
        }

    def add_violation(self, violation: Dict) -> Dict:
        """
        Add a violation to the session

        Args:
            violation: Violation details

        Returns:
            Status of violation addition
        """
        try:
            required_fields = ['type', 'severity', 'description']
            for field in required_fields:
                if field not in violation:
                    return {
                        'status': 'error',
                        'message': f'Missing required field: {field}'
                    }

            violation_with_metadata = {
                **violation,
                'timestamp': datetime.now().isoformat(),
                'violation_id': str(uuid.uuid4())
            }

            self.session_state['violations'].append(violation_with_metadata)

            return {
                'status': 'success',
                'message': 'Violation added successfully',
                'violation_id': violation_with_metadata['violation_id']
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to add violation: {str(e)}'
            }

    def complete_session(self) -> Dict:
        """Mark the session as completed"""
        try:
            self.session_state['status'] = 'completed'
            self.session_state['end_time'] = datetime.now().isoformat()

            # Calculate total time spent
            if self.session_state['start_time']:
                start = datetime.fromisoformat(self.session_state['start_time'])
                end = datetime.fromisoformat(self.session_state['end_time'])
                duration = end - start
                self.session_state['time_spent'] = int(duration.total_seconds())

            return {
                'status': 'success',
                'message': 'Session completed successfully',
                'session_summary': {
                    'session_id': self.session_state['session_id'],
                    'time_spent_seconds': self.session_state['time_spent'],
                    'questions_completed': len([q for q in self.session_state['questions_state'].values()
                                              if q.get('current_state') in ['submitted', 'skipped']]),
                    'total_violations': len(self.session_state['violations']),
                    'overall_progress': self.session_state['overall_progress']
                }
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to complete session: {str(e)}'
            }