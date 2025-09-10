import unittest
import numpy as np
from ..audio_processing import VoiceDetector, SoundClassifier, AudioProcessor

class TestVoiceDetector(unittest.TestCase):
    def setUp(self):
        self.voice_detector = VoiceDetector()
        # Create test audio samples
        self.sample_rate = 44100
        duration = 1.0  # seconds
        t = np.linspace(0, duration, int(sample_rate * duration))

        # Generate test signals
        self.silence = np.zeros(int(sample_rate * duration))
        self.voice = 0.5 * np.sin(2 * np.pi * 200 * t)  # Human voice frequency
        self.noise = np.random.normal(0, 0.1, int(sample_rate * duration))
        self.whisper = 0.1 * np.sin(2 * np.pi * 200 * t)  # Lower amplitude voice

    def test_voice_detection(self):
        result = self.voice_detector.detect(self.voice)
        self.assertTrue(result['voice_detected'])
        self.assertGreater(result['confidence'], 0.8)
        self.assertEqual(result['violation_type'], None)

    def test_silence_detection(self):
        result = self.voice_detector.detect(self.silence)
        self.assertFalse(result['voice_detected'])
        self.assertEqual(result['violation_type'], None)

    def test_noise_detection(self):
        result = self.voice_detector.detect(self.noise)
        self.assertFalse(result['voice_detected'])
        self.assertLess(result['voice_probability'], 0.3)

    def test_whisper_detection(self):
        result = self.voice_detector.detect(self.whisper)
        self.assertTrue(result['voice_detected'])
        self.assertEqual(result['violation_type'], 'continuous_speech')
        self.assertLess(result['amplitude'], 0.2)

class TestSoundClassifier(unittest.TestCase):
    def setUp(self):
        self.sound_classifier = SoundClassifier()
        self.sample_rate = 44100
        duration = 1.0
        t = np.linspace(0, duration, int(sample_rate * duration))

        # Generate test sounds
        self.keyboard_typing = np.random.uniform(-0.1, 0.1, int(sample_rate * duration))
        self.paper_rustling = 0.3 * np.sin(2 * np.pi * 1000 * t) * np.random.uniform(0.5, 1, len(t))
        self.normal_sound = 0.5 * np.sin(2 * np.pi * 440 * t)

    def test_keyboard_detection(self):
        result = self.sound_classifier.classify(self.keyboard_typing)
        self.assertEqual(result['sound_type'], 'keyboard_typing')
        self.assertEqual(result['violation_type'], 'suspicious_sound')
        self.assertGreater(result['confidence'], 0.7)

    def test_paper_rustling_detection(self):
        result = self.sound_classifier.classify(self.paper_rustling)
        self.assertEqual(result['sound_type'], 'paper_rustling')
        self.assertEqual(result['violation_type'], 'suspicious_sound')
        self.assertGreater(result['confidence'], 0.7)

    def test_normal_sound_classification(self):
        result = self.sound_classifier.classify(self.normal_sound)
        self.assertEqual(result['sound_type'], 'normal')
        self.assertEqual(result['violation_type'], None)

    def test_multiple_sound_detection(self):
        # Combine keyboard and paper sounds
        mixed_sound = self.keyboard_typing + self.paper_rustling
        result = self.sound_classifier.classify(mixed_sound)
        self.assertGreater(len(result['detected_sounds']), 1)
        self.assertEqual(result['violation_type'], 'suspicious_sound')

class TestAudioProcessor(unittest.TestCase):
    def setUp(self):
        self.audio_processor = AudioProcessor()
        self.sample_rate = 44100
        duration = 1.0
        t = np.linspace(0, duration, int(sample_rate * duration))

        # Generate test audio
        self.clean_audio = 0.5 * np.sin(2 * np.pi * 440 * t)
        self.noisy_audio = self.clean_audio + 0.2 * np.random.normal(0, 1, len(t))

    def test_noise_filtering(self):
        filtered_audio = self.audio_processor.filter_noise(self.noisy_audio)
        # Check if noise is reduced
        original_noise = np.std(self.noisy_audio - self.clean_audio)
        filtered_noise = np.std(filtered_audio - self.clean_audio)
        self.assertLess(filtered_noise, original_noise)

    def test_audio_normalization(self):
        normalized = self.audio_processor.normalize(self.clean_audio)
        self.assertLessEqual(np.max(np.abs(normalized)), 1.0)
        self.assertGreater(np.max(np.abs(normalized)), 0.1)

    def test_frequency_analysis(self):
        frequencies = self.audio_processor.analyze_frequencies(self.clean_audio)
        # Should detect 440 Hz tone
        main_freq = frequencies['main_frequency']
        self.assertAlmostEqual(main_freq, 440, delta=10)

    def test_segmentation(self):
        segments = self.audio_processor.segment_audio(self.clean_audio)
        self.assertGreater(len(segments), 0)
        # Check if segments are properly sized
        for segment in segments:
            self.assertEqual(len(segment), self.audio_processor.segment_size)

if __name__ == '__main__':
    unittest.main()
