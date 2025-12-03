import numpy as np
import librosa
import soundfile as sf
from typing import Dict, List, Tuple
import tensorflow as tf
from scipy.signal import butter, lfilter

class AudioProcessor:
    def __init__(self):
        self.sample_rate = 16000  # Match frontend sample rate
        self.fft_size = 1024     # Reduced for better real-time processing
        self.hop_length = 256     # Smaller hop for better temporal resolution
        self.frame_length = 2048  # Length of each frame to process
        
        # Initialize buffers for continuous processing
        self.audio_buffer = np.array([], dtype=np.float32)
        self.vad_buffer = []
        self.sound_history = []
        
        # Configure thresholds - lowered for better sensitivity
        self.vad_threshold = 0.01  # Extremely low threshold for voice activity
        self.noise_threshold = 0.01  # Extremely low threshold for suspicious sounds
        self.history_size = 50
        self.excessive_speech_threshold = 0.4  # New threshold for excessive speech
        
        print(f"[AUDIO] Initialized AudioProcessor with frame_length={self.frame_length}, sample_rate={self.sample_rate}")

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
        # Normalize audio frame to [-1, 1] range
        max_abs = np.max(np.abs(audio_frame))
        if max_abs > 0:
            audio_frame = audio_frame / max_abs

        # Calculate energy (RMS) with improved normalization
        energy = np.sqrt(np.mean(audio_frame ** 2))
        normalized_energy = min(1.0, energy * 100)  # Scale up for better detection
        print(f'[AUDIO] Frame energy: {energy:.6f}, Normalized: {normalized_energy:.6f}')
        
        # Calculate zero crossing rate for voice characteristics
        zero_crossings = np.sum(np.diff(np.sign(audio_frame)) != 0)
        zcr = zero_crossings / len(audio_frame)
        
        # Calculate spectral centroid for frequency content analysis
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(
            y=audio_frame, sr=self.sample_rate
        ))
        
        # More sensitive voice activity detection with normalized values
        energy_active = normalized_energy > 0.005  # Even more sensitive threshold
        zcr_voice_like = 0.0005 < zcr < 0.95  # Wider range for all speech types
        spectral_voice_like = 20 < spectral_centroid < 8000  # Full speech range
        
        # Combine criteria for more accurate detection with emphasis on energy
        if energy_active:
            vad_score = normalized_energy  # Use normalized energy directly
        elif zcr_voice_like and spectral_voice_like:
            vad_score = max(0.5, normalized_energy)  # Higher baseline for voice-like characteristics
        else:
            vad_score = normalized_energy * 0.3  # Still give some weight to energy
            
        print(f'[AUDIO] VAD metrics - Energy: {energy:.6f}, ZCR: {zcr:.3f}, Spectral: {spectral_centroid:.1f}, Score: {vad_score:.2f}')
            
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
            # Input validation
            if len(audio_data) == 0:
                print("[AUDIO] Received empty audio frame")
                return {
                    'status': 'error',
                    'error': 'Empty audio frame',
                    'violations': []
                }
            
            # Convert to float32 if needed
            if audio_data.dtype != np.float32:
                audio_data = audio_data.astype(np.float32)
            
            # Normalize audio
            max_val = np.max(np.abs(audio_data))
            if max_val > 0:
                audio_data = audio_data / max_val
            
            # Process frame
            frame = audio_data
            if len(frame) > self.frame_length:
                # Split into chunks of frame_length
                chunks = [frame[i:i + self.frame_length] for i in range(0, len(frame), self.frame_length)]
                # Process each chunk
                results = [self._process_frame(chunk) for chunk in chunks]
                # Combine results
                return self._combine_results(results)
            elif len(frame) < self.frame_length:
                # Pad if too short
                frame = np.pad(frame, (0, self.frame_length - len(frame)))
                return self._process_frame(frame)
            else:
                # Process exact frame
                return self._process_frame(frame)
                
        except Exception as e:
            print(f"[AUDIO ERROR] {e}")
            return {
                'status': 'error',
                'error': str(e),
                'violations': []
            }
            
    def _process_frame(self, frame: np.ndarray) -> Dict:
        """Process a single frame of audio"""
        # Log frame info
        print(f"[AUDIO] Processing frame: shape={frame.shape}, range=[{np.min(frame):.6f}, {np.max(frame):.6f}]")
        
        # Update buffer with current frame
        self.audio_buffer = frame
        
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
        if len(self.vad_buffer) > self.history_size:
            self.vad_buffer.pop(0)
        
        # Calculate recent voice activity
        recent_vad = np.mean(self.vad_buffer[-3:]) if len(self.vad_buffer) >= 3 else vad_score
        
        # Log metrics
        print(f"[AUDIO] Voice activity: current={vad_score:.3f}, recent={recent_vad:.3f}, history_size={len(self.vad_buffer)}")
        
        # Check for voice activity
        violations = []
        if recent_vad > self.excessive_speech_threshold:
            violations.append({
                'type': 'continuous_speech',
                'severity': 'high',
                'confidence': float(recent_vad)
            })
        elif recent_vad > self.vad_threshold:
            violations.append({
                'type': 'voice_activity',
                'severity': 'medium',
                'confidence': float(recent_vad)
            })
        
        # Add suspicious sounds
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
                'total_suspicious_sounds': len(suspicious_sounds),
                'rms_level': float(np.sqrt(np.mean(frame ** 2))),
                'peak_level': float(np.max(np.abs(frame)))
            }
        }
            
    def _combine_results(self, results: List[Dict]) -> Dict:
        """Combine results from multiple frames"""
        try:
            all_violations = []
            total_suspicious_sounds = 0
            voice_levels = []
            rms_levels = []
            peak_levels = []
            
            for result in results:
                all_violations.extend(result.get('violations', []))
                metrics = result.get('metrics', {})
                total_suspicious_sounds += metrics.get('total_suspicious_sounds', 0)
                voice_levels.append(metrics.get('voice_activity_level', 0))
                rms_levels.append(metrics.get('rms_level', 0))
                peak_levels.append(metrics.get('peak_level', 0))
            
            # Calculate averages
            avg_voice = np.mean(voice_levels) if voice_levels else 0
            avg_rms = np.mean(rms_levels) if rms_levels else 0
            max_peak = np.max(peak_levels) if peak_levels else 0
            
            return {
                'status': 'violation' if all_violations else 'clear',
                'violations': all_violations,
                'metrics': {
                    'voice_activity_level': float(avg_voice),
                    'total_suspicious_sounds': total_suspicious_sounds,
                    'rms_level': float(avg_rms),
                    'peak_level': float(max_peak)
                }
            }
        except Exception as e:
            print(f'[AUDIO ERROR] Failed to combine results: {e}')
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
