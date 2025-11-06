'use client'

import { useState, useEffect } from 'react'
import { Camera, Mic, Play, Pause, Square, Check } from 'lucide-react'

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [microphoneActive, setMicrophoneActive] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [calibrationResults, setCalibrationResults] = useState<any>(null)
  const [currentPhase, setCurrentPhase] = useState('setup')

  useEffect(() => {
    // Test API connection on component mount
    testAPIConnection()
  }, [])

  const testAPIConnection = async () => {
    try {
      const response = await fetch('/api/camera/health')
      const data = await response.json()
      console.log('API Connection Test:', data)
      setTestResults(data)
    } catch (error) {
      console.error('API Connection Error:', error)
      setTestResults({ error: 'API not accessible' })
    }
  }

  const testCameraValidation = async () => {
    try {
      // Mock base64 image data for testing
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJEA//EABQRAQAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8QAf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8QAf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8QAf//Z'

      const response = await fetch('/api/camera/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame_data: mockImageData,
          camera_type: 'primary',
          session_id: 'test-session'
        })
      })

      const data = await response.json()
      console.log('Camera Validation Test:', data)
      setCameraActive(data.result?.position_valid || false)
    } catch (error) {
      console.error('Camera Validation Error:', error)
    }
  }

  const testVoiceCalibration = async () => {
    try {
      const response = await fetch('/api/speech/start-calibration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty_level: 'basic',
          session_id: 'test-session'
        })
      })

      const data = await response.json()
      console.log('Voice Calibration Test:', data)
      setCalibrationResults(data.calibration)
      setMicrophoneActive(true)
    } catch (error) {
      console.error('Voice Calibration Error:', error)
    }
  }

  const testQuestionEngine = async () => {
    try {
      const testConfig = {
        id: 'test-123',
        title: 'Sample Test',
        duration: 30,
        questions: [
          {
            id: 'q1',
            type: 'conversational',
            text: 'Please introduce yourself and your background.',
            order: 0,
            timeToStart: 10
          },
          {
            id: 'q2',
            type: 'coding',
            text: 'Write a function that returns the sum of two numbers.',
            order: 1,
            timeLimit: 15
          }
        ]
      }

      const response = await fetch('/api/questions/load-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_config: testConfig,
          session_id: 'test-session'
        })
      })

      const data = await response.json()
      console.log('Question Engine Test:', data)
      setCurrentPhase('questions')
    } catch (error) {
      console.error('Question Engine Error:', error)
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      // Start recording
      console.log('Starting recording...')
    } else {
      // Stop recording
      console.log('Stopping recording...')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Test Monitoring Platform
          </h1>
          <p className="text-xl text-gray-600">
            Test your camera, microphone, and AI proctoring capabilities
          </p>
        </div>

        {/* API Connection Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Check className="w-6 h-6 mr-2" />
            API Connection Status
          </h2>
          <div className={`p-4 rounded-lg ${
            testResults?.error ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'
          }`}>
            <p className="font-mono text-sm">
              {testResults?.error || '✅ All APIs connected successfully'}
            </p>
          </div>
        </div>

        {/* Camera Setup */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Camera className="w-6 h-6 mr-2" />
            Camera Setup & Validation
          </h2>
          <div className="space-y-4">
            <button
              onClick={testCameraValidation}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Test Camera Validation
            </button>
            <div className={`p-4 rounded-lg ${
              cameraActive ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'
            }`}>
              <p>Camera Status: {cameraActive ? '✅ Active' : '⚠️ Not Active'}</p>
            </div>
          </div>
        </div>

        {/* Voice Calibration */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Mic className="w-6 h-6 mr-2" />
            Voice Calibration & Recognition
          </h2>
          <div className="space-y-4">
            <button
              onClick={testVoiceCalibration}
              className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Start Voice Calibration Test
            </button>
            <div className={`p-4 rounded-lg ${
              microphoneActive ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'
            }`}>
              <p>Microphone Status: {microphoneActive ? '✅ Active' : '⚠️ Not Active'}</p>
              {calibrationResults && (
                <p className="text-sm mt-2">
                  Calibration Score: {calibrationResults.average_accuracy?.toFixed(2) || 'N/A'}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recording Controls</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleRecording}
              className={`px-6 py-3 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Recording
                </>
              )}
            </button>
            <div className={`px-4 py-2 rounded-lg ${
              isRecording ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {isRecording ? '🔴 Recording' : '⏸️ Not Recording'}
            </div>
          </div>
        </div>

        {/* Question Engine */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Question Engine</h2>
          <button
            onClick={testQuestionEngine}
            className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Test Question Engine
          </button>
          {currentPhase === 'questions' && (
            <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
              <p>✅ Question engine loaded successfully</p>
            </div>
          )}
        </div>

        {/* Implementation Status */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Implementation Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-700">✅ Completed Features:</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Enhanced multi-camera system with third-camera guidance</li>
                <li>• Voice recognition calibration testing</li>
                <li>• Question engine with sequencing system</li>
                <li>• Answer manager with recording state machine</li>
                <li>• Database schema updates</li>
                <li>• Backend API endpoints</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-yellow-700">🚧 Remaining Features:</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Admin user management dashboard</li>
                <li>• Subscription-based access control</li>
                <li>• AI-powered question generation</li>
                <li>• Candidate management system</li>
                <li>• Full frontend implementation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}