#!/usr/bin/env python3
"""
Test script for the enhanced voice recognition system
Tests the speech recognition functionality and text comparison algorithms
"""

import sys
import os
import json
import base64
import numpy as np

# Add the AI service modules to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'ai_service'))

try:
    from modules.speech_recognition import SpeechRecognizer
    print("✅ Successfully imported SpeechRecognizer")
except ImportError as e:
    print(f"❌ Failed to import SpeechRecognizer: {e}")
    sys.exit(1)

def test_slogan_generation():
    """Test random slogan generation"""
    print("\n🎯 Testing Slogan Generation...")
    
    recognizer = SpeechRecognizer()
    
    # Generate 5 random slogans
    slogans = []
    for i in range(5):
        slogan = recognizer.get_random_sentence()
        slogans.append(slogan)
        print(f"  {i+1}. {slogan}")
    
    # Verify uniqueness (should be different most of the time)
    unique_slogans = set(slogans)
    print(f"  Generated {len(slogans)} slogans, {len(unique_slogans)} unique")
    
    if len(unique_slogans) >= 3:
        print("✅ Slogan generation working correctly")
        return True
    else:
        print("⚠️  Low slogan diversity, but functional")
        return True

def test_text_comparison():
    """Test text comparison and similarity algorithms"""
    print("\n🔍 Testing Text Comparison...")
    
    recognizer = SpeechRecognizer()
    
    # Test cases: (reference, transcription, expected_accuracy_range)
    test_cases = [
        ("Hello world", "Hello world", (0.95, 1.0)),  # Perfect match
        ("Hello world", "hello world", (0.95, 1.0)),  # Case difference
        ("Hello world", "Hello world!", (0.90, 1.0)),  # Punctuation
        ("Hello world", "Hello word", (0.70, 0.90)),  # Minor typo
        ("Hello world", "Hi world", (0.50, 0.80)),    # Word substitution
        ("Hello world", "Goodbye universe", (0.0, 0.30)),  # Completely different
    ]
    
    all_passed = True
    
    for ref, trans, (min_acc, max_acc) in test_cases:
        similarity = recognizer._calculate_similarity_score(ref, trans)
        accuracy = similarity['overall_accuracy']
        
        passed = min_acc <= accuracy <= max_acc
        status = "✅" if passed else "❌"
        
        print(f"  {status} '{ref}' vs '{trans}' -> {accuracy:.2f} (expected {min_acc}-{max_acc})")
        
        if not passed:
            all_passed = False
    
    if all_passed:
        print("✅ Text comparison algorithms working correctly")
    else:
        print("❌ Some text comparison tests failed")
    
    return all_passed

def test_levenshtein_distance():
    """Test Levenshtein distance calculation"""
    print("\n📏 Testing Levenshtein Distance...")
    
    recognizer = SpeechRecognizer()
    
    # Test cases: (string1, string2, expected_distance)
    test_cases = [
        ("", "", 0),
        ("hello", "", 5),
        ("", "world", 5),
        ("hello", "hello", 0),
        ("hello", "hallo", 1),
        ("kitten", "sitting", 3),
        ("saturday", "sunday", 3),
    ]
    
    all_passed = True
    
    for s1, s2, expected in test_cases:
        distance = recognizer.calculate_levenshtein_distance(s1, s2)
        passed = distance == expected
        status = "✅" if passed else "❌"
        
        print(f"  {status} '{s1}' vs '{s2}' -> {distance} (expected {expected})")
        
        if not passed:
            all_passed = False
    
    if all_passed:
        print("✅ Levenshtein distance calculation working correctly")
    else:
        print("❌ Some Levenshtein distance tests failed")
    
    return all_passed

def test_audio_simulation():
    """Test audio simulation functionality"""
    print("\n🎵 Testing Audio Simulation...")
    
    recognizer = SpeechRecognizer()
    
    # Set a test sentence
    test_sentence = "Innovation distinguishes between a leader and a follower"
    recognizer.current_sentence = test_sentence
    
    # Generate dummy audio data
    sample_rate = 16000
    duration = 3  # seconds
    audio_data = np.random.normal(0, 0.1, sample_rate * duration).astype(np.float32)
    
    # Test simulation
    try:
        simulated_text = recognizer._simulate_transcription(audio_data)
        print(f"  Original: {test_sentence}")
        print(f"  Simulated: {simulated_text}")
        
        # Verify simulation produces reasonable output
        if simulated_text and len(simulated_text) > 0:
            print("✅ Audio simulation working")
            return True
        else:
            print("❌ Audio simulation failed")
            return False
            
    except Exception as e:
        print(f"❌ Audio simulation error: {e}")
        return False

def test_audio_quality_analysis():
    """Test audio quality analysis"""
    print("\n🔊 Testing Audio Quality Analysis...")
    
    recognizer = SpeechRecognizer()
    
    # Generate test audio with different characteristics
    sample_rate = 16000
    duration = 2
    
    # Test case 1: Good quality audio
    good_audio = np.sin(2 * np.pi * 440 * np.linspace(0, duration, sample_rate * duration)) * 0.5
    good_quality = recognizer._analyze_audio_quality(good_audio.astype(np.float32))
    
    # Test case 2: Quiet audio
    quiet_audio = good_audio * 0.1
    quiet_quality = recognizer._analyze_audio_quality(quiet_audio.astype(np.float32))
    
    # Test case 3: Noisy audio
    noisy_audio = good_audio + np.random.normal(0, 0.3, len(good_audio))
    noisy_quality = recognizer._analyze_audio_quality(noisy_audio.astype(np.float32))
    
    print(f"  Good audio quality: {good_quality['overall_quality']:.2f}")
    print(f"  Quiet audio quality: {quiet_quality['overall_quality']:.2f}")
    print(f"  Noisy audio quality: {noisy_quality['overall_quality']:.2f}")
    
    # Verify quality scores make sense
    if (good_quality['overall_quality'] > quiet_quality['overall_quality'] and
        good_quality['overall_quality'] > noisy_quality['overall_quality']):
        print("✅ Audio quality analysis working correctly")
        return True
    else:
        print("❌ Audio quality analysis not working as expected")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Enhanced Voice Recognition System")
    print("=" * 50)
    
    tests = [
        ("Slogan Generation", test_slogan_generation),
        ("Text Comparison", test_text_comparison),
        ("Levenshtein Distance", test_levenshtein_distance),
        ("Audio Simulation", test_audio_simulation),
        ("Audio Quality Analysis", test_audio_quality_analysis),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Voice recognition system is ready.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
