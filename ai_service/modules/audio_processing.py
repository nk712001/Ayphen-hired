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
        
        # Configure thresholds - lowered for better sensitivity
        self.vad_threshold = 0.2  # Lower threshold for voice activity
        self.noise_threshold = 0.15  # Lower threshold for suspicious sounds
        self.history_size = 50
        self.excessive_speech_threshold = 0.4  # New threshold for excessive speech

    def _butter_bandpass(self, lowcut: float, highcut: float, order: int = 5) -> Tuple:
        """Create butterworth bandpass filter"""
        nyquist = 0.5 * self.sample_rate
        low = lowcut / nyquist
        high = highcut / nyquist
        
        # Ensure frequencies are within valid range (0 < Wn < 1)
        low = max(0.001, min(low, 0.999))
        high = max(0.001, min(high, 0.999))
        
        # Ensure low < high
        if low >= high:
            low = high - 0.1
            if low <= 0:
                low = 0.001
                high = 0.1
        
        print(f"[AUDIO DEBUG] Filter frequencies: lowcut={lowcut}Hz, highcut={highcut}Hz, normalized: low={low}, high={high}")
        b, a = butter(order, [low, high], btype='band')
        return b, a

    def _apply_bandpass_filter(self, data: np.ndarray, lowcut: float, highcut: float) -> np.ndarray:
        """Apply bandpass filter to audio data"""
        b, a = self._butter_bandpass(lowcut, highcut)
        return lfilter(b, a, data)

    def _detect_voice_activity(self, audio_frame: np.ndarray) -> float:
        """Detect voice activity in audio frame with improved sensitivity"""
        # Calculate energy (RMS)
        energy = np.sqrt(np.mean(audio_frame ** 2))
        
        # Calculate zero crossing rate for voice characteristics
        zero_crossings = np.sum(np.diff(np.sign(audio_frame)) != 0)
        zcr = zero_crossings / len(audio_frame)
        
        # Calculate spectral centroid for frequency content analysis
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(
            y=audio_frame, sr=self.sample_rate
        ))
        
        # Improved voice activity detection with multiple criteria
        energy_active = energy > self.vad_threshold
        zcr_voice_like = 0.01 < zcr < 0.3  # Typical range for speech
        spectral_voice_like = 500 < spectral_centroid < 4000  # Typical speech frequencies
        
        # Combine criteria for more accurate detection
        if energy_active and zcr_voice_like and spectral_voice_like:
            vad_score = min(1.0, energy / self.vad_threshold)  # Normalized confidence
        else:
            vad_score = 0.0
            
        return float(vad_score)

    def _detect_suspicious_sounds(self, audio_frame: np.ndarray) -> List[Dict]:
        """Detect suspicious sounds like paper rustling, keyboard typing, whispering"""
        suspicious_sounds = []
        
        try:
            # Filter for different frequency ranges (appropriate for 16kHz sample rate)
            paper_freq = self._apply_bandpass_filter(audio_frame, 800, 3000)  # Paper rustling
            keyboard_freq = self._apply_bandpass_filter(audio_frame, 1500, 4000)  # Keyboard typing  
            whisper_freq = self._apply_bandpass_filter(audio_frame, 200, 1200)  # Whispering
            
            # Calculate energy in each frequency band
            paper_energy = np.mean(np.abs(paper_freq))
            keyboard_energy = np.mean(np.abs(keyboard_freq))
            whisper_energy = np.mean(np.abs(whisper_freq))
        except Exception as e:
            print(f"[AUDIO DEBUG] Filter error: {e}, using raw audio energy")
            # Fallback to simple energy calculation if filtering fails
            paper_energy = np.mean(np.abs(audio_frame[512:1024]))  # Mid-high frequencies
            keyboard_energy = np.mean(np.abs(audio_frame[1024:1536]))  # High frequencies
            whisper_energy = np.mean(np.abs(audio_frame[0:512]))  # Low frequencies
        
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
            # Reduced debug logging for performance
            if len(self.sound_history) % 25 == 0:  # Log every 25th frame (every 5 seconds)
                print(f"[AUDIO DEBUG] Processing frame {len(self.sound_history)}: shape={audio_data.shape}, range=[{np.min(audio_data):.3f}, {np.max(audio_data):.3f}]")
            
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
                
                # Maintain history size and VAD buffer size for memory efficiency
                if len(self.sound_history) > self.history_size:
                    self.sound_history.pop(0)
                if len(self.vad_buffer) > self.history_size:
                    self.vad_buffer.pop(0)
                
                # Analyze recent history for violations
                recent_vad = np.mean(self.vad_buffer[-10:]) if self.vad_buffer else 0
                violations = []
                
                # Log VAD metrics periodically for monitoring
                if len(self.sound_history) % 25 == 0:
                    print(f"[AUDIO DEBUG] VAD metrics - Recent: {recent_vad:.3f}, Buffer size: {len(self.vad_buffer)}, Suspicious sounds: {len(suspicious_sounds)}")
                
                # Check for continuous voice activity (excessive talking)
                if recent_vad > self.excessive_speech_threshold:
                    violations.append({
                        'type': 'continuous_speech',
                        'severity': 'high',
                        'confidence': float(recent_vad),
                        'message': 'Excessive talking detected'
                    })
                
                # Check for moderate voice activity (general talking)
                elif recent_vad > self.vad_threshold:
                    violations.append({
                        'type': 'voice_activity',
                        'severity': 'medium',
                        'confidence': float(recent_vad),
                        'message': 'Voice activity detected'
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
