import unittest
import numpy as np
import base64
from unittest.mock import MagicMock, patch
import sys
import os

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from speech_recognition import SpeechRecognizer

class TestSpeechRecognizer(unittest.TestCase):
    def setUp(self):
        # Create a mock audio processor
        self.mock_audio_processor = MagicMock()
        self.mock_audio_processor.process_audio.return_value = {
            'status': 'clear',
            'metrics': {
                'voice_activity_level': 0.8
            }
        }
        
        # Create test audio data
        self.test_audio = np.sin(np.linspace(0, 1000, 16000)).astype(np.float32)  # 1 second of audio at 16kHz
        self.test_audio_b64 = self._audio_to_base64(self.test_audio)
        
        # Create instance with mocked audio processor
        with patch('speech_recognition.AudioProcessor', return_value=self.mock_audio_processor):
            self.speech_recognizer = SpeechRecognizer()
    
    def _audio_to_base64(self, audio_data):
        """Convert numpy audio data to base64 string"""
        buffer = audio_data.tobytes()
        return base64.b64encode(buffer).decode('utf-8')
    
    def test_get_random_sentence(self):
        """Test getting a random test sentence"""
        sentence = self.speech_recognizer.get_random_sentence()
        self.assertIsNotNone(sentence)
        self.assertIn(sentence, self.speech_recognizer.reference_sentences)
    
    def test_decode_audio(self):
        """Test audio decoding from base64"""
        decoded = self.speech_recognizer._decode_audio(self.test_audio_b64)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded.shape, self.test_audio.shape)
        np.testing.assert_array_almost_equal(decoded, self.test_audio)
    
    def test_process_audio_chunk_buffering(self):
        """Test processing audio chunk when buffer is not full yet"""
        # Set up a small buffer
        self.speech_recognizer.audio_buffer = np.zeros(1000, dtype=np.float32)
        
        result = self.speech_recognizer.process_audio_chunk(self.test_audio_b64)
        self.assertEqual(result['status'], 'buffering')
        self.assertIn('buffer_size', result)
        self.assertIn('Collecting audio', result['message'])
    
    @patch('speech_recognition.SpeechRecognizer.analyze_speech')
    def test_process_audio_chunk_complete(self, mock_analyze):
        """Test processing audio chunk when buffer is full"""
        # Set up a buffer that's large enough to trigger analysis
        self.speech_recognizer.audio_buffer = np.zeros(self.speech_recognizer.sample_rate * 3, dtype=np.float32)
        
        mock_analyze.return_value = {
            'status': 'complete',
            'voice_activity': 0.8,
            'audio_quality': {'overall_quality': 0.9},
            'recognition_accuracy': 0.85,
            'is_acceptable': True,
            'message': 'Good audio quality'
        }
        
        result = self.speech_recognizer.process_audio_chunk(self.test_audio_b64)
        self.assertEqual(result['status'], 'complete')
        self.assertEqual(result['voice_activity'], 0.8)
        self.assertEqual(result['audio_quality']['overall_quality'], 0.9)
        self.assertEqual(result['recognition_accuracy'], 0.85)
        self.assertTrue(result['is_acceptable'])
        self.assertEqual(result['message'], 'Good audio quality')
    
    def test_analyze_speech(self):
        """Test speech analysis"""
        # Set up audio buffer
        self.speech_recognizer.audio_buffer = self.test_audio
        
        # Mock _analyze_audio_quality and _simulate_recognition_accuracy
        with patch('speech_recognition.SpeechRecognizer._analyze_audio_quality') as mock_quality:
            with patch('speech_recognition.SpeechRecognizer._simulate_recognition_accuracy') as mock_recognition:
                mock_quality.return_value = {
                    'volume_level': 0.8,
                    'signal_to_noise': 0.9,
                    'clarity': 0.85,
                    'background_noise_level': 0.1,
                    'overall_quality': 0.85
                }
                mock_recognition.return_value = 0.9
                
                result = self.speech_recognizer.analyze_speech()
                
                self.assertEqual(result['status'], 'complete')
                self.assertEqual(result['voice_activity'], 0.8)
                self.assertEqual(result['audio_quality']['overall_quality'], 0.85)
                self.assertEqual(result['recognition_accuracy'], 0.9)
                self.assertTrue(result['is_acceptable'])
                self.assertIn('message', result)
                
                # Verify buffer is reset after analysis
                self.assertEqual(len(self.speech_recognizer.audio_buffer), 0)
    
    def test_analyze_audio_quality(self):
        """Test audio quality analysis"""
        quality = self.speech_recognizer._analyze_audio_quality(self.test_audio)
        
        self.assertIn('volume_level', quality)
        self.assertIn('signal_to_noise', quality)
        self.assertIn('clarity', quality)
        self.assertIn('background_noise_level', quality)
        self.assertIn('overall_quality', quality)
        
        # Check that values are in expected range
        self.assertGreaterEqual(quality['volume_level'], 0.0)
        self.assertLessEqual(quality['volume_level'], 1.0)
        self.assertGreaterEqual(quality['overall_quality'], 0.0)
        self.assertLessEqual(quality['overall_quality'], 1.0)
    
    def test_simulate_recognition_accuracy(self):
        """Test recognition accuracy simulation"""
        audio_quality = {
            'volume_level': 0.8,
            'clarity': 0.9,
            'background_noise_level': 0.1
        }
        
        accuracy = self.speech_recognizer._simulate_recognition_accuracy(audio_quality)
        
        self.assertGreaterEqual(accuracy, 0.0)
        self.assertLessEqual(accuracy, 1.0)
        
        # Test with poor quality
        poor_quality = {
            'volume_level': 0.2,
            'clarity': 0.3,
            'background_noise_level': 0.8
        }
        
        poor_accuracy = self.speech_recognizer._simulate_recognition_accuracy(poor_quality)
        
        # Poor quality should result in lower accuracy
        self.assertLess(poor_accuracy, accuracy)
    
    def test_get_feedback_message(self):
        """Test feedback message generation"""
        # Test with low volume
        message = self.speech_recognizer._get_feedback_message(
            {'volume_level': 0.2, 'background_noise_level': 0.1, 'clarity': 0.8, 'overall_quality': 0.5},
            0.8
        )
        self.assertIn('voice is too quiet', message)
        
        # Test with high background noise
        message = self.speech_recognizer._get_feedback_message(
            {'volume_level': 0.8, 'background_noise_level': 0.7, 'clarity': 0.8, 'overall_quality': 0.5},
            0.8
        )
        self.assertIn('High background noise', message)
        
        # Test with low clarity
        message = self.speech_recognizer._get_feedback_message(
            {'volume_level': 0.8, 'background_noise_level': 0.1, 'clarity': 0.3, 'overall_quality': 0.5},
            0.8
        )
        self.assertIn('voice is unclear', message)
        
        # Test with low recognition accuracy
        message = self.speech_recognizer._get_feedback_message(
            {'volume_level': 0.8, 'background_noise_level': 0.1, 'clarity': 0.8, 'overall_quality': 0.8},
            0.6
        )
        self.assertIn('speech was not recognized accurately', message)
        
        # Test with excellent quality
        message = self.speech_recognizer._get_feedback_message(
            {'volume_level': 0.9, 'background_noise_level': 0.1, 'clarity': 0.9, 'overall_quality': 0.9},
            0.95
        )
        self.assertIn('Excellent audio quality', message)
        
        # Test with good quality
        message = self.speech_recognizer._get_feedback_message(
            {'volume_level': 0.8, 'background_noise_level': 0.2, 'clarity': 0.7, 'overall_quality': 0.7},
            0.8
        )
        self.assertIn('Good audio quality', message)
    
    def test_calculate_levenshtein_distance(self):
        """Test Levenshtein distance calculation"""
        # Test identical strings
        distance = self.speech_recognizer.calculate_levenshtein_distance("hello", "hello")
        self.assertEqual(distance, 0)
        
        # Test completely different strings
        distance = self.speech_recognizer.calculate_levenshtein_distance("hello", "world")
        self.assertEqual(distance, 5)
        
        # Test strings with some similarity
        distance = self.speech_recognizer.calculate_levenshtein_distance("kitten", "sitting")
        self.assertEqual(distance, 3)
        
        # Test with empty string
        distance = self.speech_recognizer.calculate_levenshtein_distance("hello", "")
        self.assertEqual(distance, 5)
    
    def test_reset(self):
        """Test resetting the speech recognizer state"""
        # Set up some state
        self.speech_recognizer.audio_buffer = np.ones(1000, dtype=np.float32)
        self.speech_recognizer.current_sentence = "Test sentence"
        
        # Reset
        self.speech_recognizer.reset()
        
        # Verify state is reset
        self.assertEqual(len(self.speech_recognizer.audio_buffer), 0)
        self.assertIsNone(self.speech_recognizer.current_sentence)
        # Verify audio processor reset was called
        self.mock_audio_processor.reset_state.assert_called_once()

if __name__ == '__main__':
    unittest.main()
