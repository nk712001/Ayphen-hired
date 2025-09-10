import numpy as np
import librosa
import soundfile as sf
from typing import Dict, List, Tuple
import tensorflow as tf
from scipy.signal import butter, lfilter

class AudioProcessor:
    def __init__(self):
        self.sample_rate = 16000
        self.frame_length = 1024
        self.hop_length = 512
        
        # Initialize buffers for continuous processing
        self.audio_buffer = np.array([])
        self.vad_buffer = []
        self.sound_history = []
        
        # Configure thresholds
        self.vad_threshold = 0.5
        self.noise_threshold = 0.3
        self.history_size = 50

    def _butter_bandpass(self, lowcut: float, highcut: float, order: int = 5) -> Tuple:
        """Create butterworth bandpass filter"""
        nyquist = 0.5 * self.sample_rate
        low = lowcut / nyquist
        high = highcut / nyquist
        b, a = butter(order, [low, high], btype='band')
        return b, a

    def _apply_bandpass_filter(self, data: np.ndarray, lowcut: float, highcut: float) -> np.ndarray:
        """Apply bandpass filter to audio data"""
        b, a = self._butter_bandpass(lowcut, highcut)
        return lfilter(b, a, data)

    def _detect_voice_activity(self, audio_frame: np.ndarray) -> float:
        """Detect voice activity in audio frame"""
        # Extract features
        mfccs = librosa.feature.mfcc(
            y=audio_frame,
            sr=self.sample_rate,
            n_mfcc=13,
            hop_length=self.hop_length
        )
        
        # Calculate energy
        energy = np.mean(librosa.feature.rms(
            y=audio_frame,
            hop_length=self.hop_length
        ))
        
        # Calculate zero crossing rate
        zcr = np.mean(librosa.feature.zero_crossing_rate(
            y=audio_frame,
            hop_length=self.hop_length
        ))
        
        # Simple voice activity detection based on features
        vad_score = (energy > self.vad_threshold) and (zcr < 0.2)
        return float(vad_score)

    def _detect_suspicious_sounds(self, audio_frame: np.ndarray) -> List[Dict]:
        """Detect suspicious sounds in audio frame"""
        suspicious_sounds = []
        
        # Apply different bandpass filters for different types of sounds
        # Paper rustling (2000-4000 Hz)
        paper_band = self._apply_bandpass_filter(audio_frame, 2000, 4000)
        paper_energy = np.mean(np.abs(paper_band))
        
        # Keyboard typing (1000-2000 Hz)
        keyboard_band = self._apply_bandpass_filter(audio_frame, 1000, 2000)
        keyboard_energy = np.mean(np.abs(keyboard_band))
        
        # Whispering (4000-8000 Hz)
        whisper_band = self._apply_bandpass_filter(audio_frame, 4000, 8000)
        whisper_energy = np.mean(np.abs(whisper_band))
        
        # Check for suspicious sounds
        if paper_energy > self.noise_threshold:
            suspicious_sounds.append({
                'type': 'paper_rustling',
                'confidence': float(paper_energy),
                'timestamp': len(self.sound_history)
            })
            
        if keyboard_energy > self.noise_threshold:
            suspicious_sounds.append({
                'type': 'keyboard_typing',
                'confidence': float(keyboard_energy),
                'timestamp': len(self.sound_history)
            })
            
        if whisper_energy > self.noise_threshold:
            suspicious_sounds.append({
                'type': 'whispering',
                'confidence': float(whisper_energy),
                'timestamp': len(self.sound_history)
            })
            
        return suspicious_sounds

    def process_audio(self, audio_data: np.ndarray) -> Dict:
        """Process audio frame and detect violations"""
        try:
            # Ensure correct sample rate
            if len(audio_data) == 0:
                return {
                    'status': 'error',
                    'error': 'Empty audio frame',
                    'violations': []
                }
            
            # Add to buffer for continuous processing
            self.audio_buffer = np.concatenate([self.audio_buffer, audio_data])
            
            # Process only complete frames
            if len(self.audio_buffer) >= self.frame_length:
                # Extract frame and update buffer
                frame = self.audio_buffer[:self.frame_length]
                self.audio_buffer = self.audio_buffer[self.hop_length:]
                
                # Detect voice activity
                vad_score = self._detect_voice_activity(frame)
                self.vad_buffer.append(vad_score)
                
                # Detect suspicious sounds
                suspicious_sounds = self._detect_suspicious_sounds(frame)
                
                # Update history
                self.sound_history.append({
                    'vad_score': vad_score,
                    'suspicious_sounds': suspicious_sounds
                })
                
                # Maintain history size
                if len(self.sound_history) > self.history_size:
                    self.sound_history.pop(0)
                
                # Analyze recent history for violations
                recent_vad = np.mean(self.vad_buffer[-10:]) if self.vad_buffer else 0
                violations = []
                
                # Check for continuous voice activity
                if recent_vad > 0.7:
                    violations.append({
                        'type': 'continuous_speech',
                        'severity': 'high',
                        'confidence': float(recent_vad)
                    })
                
                # Check for suspicious sounds
                for sound in suspicious_sounds:
                    violations.append({
                        'type': f'suspicious_sound_{sound["type"]}',
                        'severity': 'medium',
                        'confidence': sound['confidence']
                    })
                
                return {
                    'status': 'violation' if violations else 'clear',
                    'violations': violations,
                    'metrics': {
                        'voice_activity_level': float(recent_vad),
                        'total_suspicious_sounds': len(suspicious_sounds)
                    }
                }
            
            return {
                'status': 'buffering',
                'violations': [],
                'metrics': {
                    'buffer_size': len(self.audio_buffer)
                }
            }

        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'violations': []
            }

    def reset_state(self):
        """Reset the processor's state"""
        self.audio_buffer = np.array([])
        self.vad_buffer = []
        self.sound_history = []
