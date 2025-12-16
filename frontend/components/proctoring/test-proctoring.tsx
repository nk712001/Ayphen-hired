'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useProctoring } from '@/lib/proctoring/proctoring-context';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ViolationReport } from './ViolationReport';

export const TestProctoring: React.FC = () => {
  const {
    isProctoringActive,
    isCameraActive,
    isMicrophoneActive,
    isScreenShared,
    toggleMicrophone,
    toggleScreenShare,
    violations,
    videoRef,
    stopProctoring,
    metrics,
  } = useProctoring();

  const [showVideo] = useState(true);
  const [showViolations, setShowViolations] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  // Remove simulation states, use backend data

  // Real-time metrics from backend
  const faceVisible = metrics?.face_confidence !== undefined ? metrics.face_confidence > 0.5 : true; // Default to true until backend responds
  const gazeScore = metrics?.gaze_score ?? 0;
  
  // Debug logging for metrics
  useEffect(() => {
    console.log('TestProctoring metrics update:', metrics);
    console.log('Face visible calculated:', faceVisible);
  }, [metrics, faceVisible]);
  // Tab/window switching detection
  const [tabActive, setTabActive] = useState(true);

  // Track tab or window focus/visibility
  useEffect(() => {
    if (!isProctoringActive) return;
    let violationReported = false;
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        setTabActive(false);
        if (!violationReported) {
          violations.push({
            type: 'tab_switch',
            timestamp: Date.now(),
            message: 'User switched away from the test tab or window.'
          });
          violationReported = true;
        }
      } else {
        setTabActive(true);
        violationReported = false;
      }
    }
    function handleBlur() {
      setTabActive(false);
      if (!violationReported) {
        violations.push({
          type: 'tab_switch',
          timestamp: Date.now(),
          message: 'User switched away from the test tab or window.'
        });
        violationReported = true;
      }
    }
    function handleFocus() {
      setTabActive(true);
      violationReported = false;
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isProctoringActive, violations]);
  const fullScreenActive = true;

  // Calculate overall test integrity score (0-100)
  const calculateIntegrityScore = () => {
    let score = 100;
    
    // Deduct points for violations
    score -= violations.length * 5;
    
    // Deduct points for inactive devices
    if (!isCameraActive) score -= 10;
    if (!isMicrophoneActive) score -= 5;
    
    // Deduct points for face visibility and gaze
    if (!faceVisible) score -= 15;
    score -= (1 - gazeScore) * 20;
    
    // Deduct points for tab/window changes
    // (If you add tabActive/fullScreenActive to context, use them)
    // if (!tabActive) score -= 20;
    // if (!fullScreenActive) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const integrityScore = calculateIntegrityScore();
  const isIntegrityGood = integrityScore >= 70;
  const isIntegrityWarning = integrityScore >= 30 && integrityScore < 70;
  const isIntegrityDanger = integrityScore < 30;

  if (!isProctoringActive) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Proctoring Inactive</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Proctoring is not currently active. Please start the test to enable proctoring.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showWarning && (
        <Alert className="bg-yellow-50 border-yellow-200 flex items-start">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <AlertTitle className="text-yellow-800">Proctoring Active</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Your test session is being monitored. Any suspicious activity may be flagged.
            </AlertDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-yellow-700 hover:bg-yellow-100 flex items-center justify-center flex-shrink-0"
            onClick={() => setShowWarning(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main test content area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <Button 
                variant={showViolations ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowViolations(!showViolations)}
                className="h-8 flex items-center"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                {violations.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {violations.length}
                  </span>
                )}
              </Button>
            </div>
            
            <div className="relative aspect-video bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {/* Overlay indicators */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="flex space-x-2">
                  <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                    isCameraActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isCameraActive ? 'Camera On' : 'Camera Off'}
                  </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                    isMicrophoneActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isMicrophoneActive ? 'Mic On' : 'Mic Off'}
                  </div>
                  {isScreenShared && (
                    <div className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      Screen Sharing
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {!tabActive && (
                    <div className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                      Return to Test
                    </div>
                  )}
                  {!fullScreenActive && (
                    <div className="px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                      Full Screen Recommended
                    </div>
                  )}
                </div>
              </div>
              
              {/* Face detection indicator */}
              {!faceVisible && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-center p-4 bg-red-600 rounded-lg">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Face not detected</p>
                    <p className="text-sm">Please position your face in the frame</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Test Integrity Score</h4>
                  <div className="text-sm text-gray-500">
                    {isIntegrityGood && 'Your test environment looks good'}
                    {isIntegrityWarning && 'Some issues detected'}
                    {isIntegrityDanger && 'Critical issues detected'}
                  </div>
                </div>
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e6e6e6"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={isIntegrityDanger ? "#ef4444" : isIntegrityWarning ? "#f59e0b" : "#10b981"}
                      strokeWidth="3"
                      strokeDasharray={`${integrityScore}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${
                      isIntegrityDanger ? 'text-red-600' : 
                      isIntegrityWarning ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {integrityScore}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Face Detection</span>
                  <span className={faceVisible ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {faceVisible ? 'Good' : 'Not Detected'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Gaze Focus</span>
                  <span className={gazeScore > 0.8 ? 'text-green-600' : gazeScore > 0.5 ? 'text-yellow-600' : 'text-red-600'}>
                    {gazeScore > 0.8 ? 'Focused' : gazeScore > 0.5 ? 'Moderate' : 'Distracted'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Window Focus</span>
                  <span className={tabActive ? 'text-green-600' : 'text-red-600'}>
                    {tabActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Test content would go here */}
        </div>
        
        {/* Right sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Proctoring Status</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    isCameraActive ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm">Camera</span>
                </div>
                              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    isMicrophoneActive ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm">Microphone</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleMicrophone}
                  className="h-8 text-xs flex items-center justify-center"
                >
                  {isMicrophoneActive ? (
                    <><Mic className="h-3 w-3 mr-1" />Mute</>
                  ) : (
                    <><MicOff className="h-3 w-3 mr-1" />Unmute</>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    isScreenShared ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-sm">Screen Sharing</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleScreenShare}
                  className="h-8 text-xs flex items-center justify-center"
                  disabled={!isCameraActive}
                >
                  {isScreenShared ? (
                    <><MonitorOff className="h-3 w-3 mr-1" />Stop Sharing</>
                  ) : (
                    <><Monitor className="h-3 w-3 mr-1" />Share Screen</>
                  )}
                </Button>
              </div>
            </div>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Test Guidelines</CardTitle>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {violations.length} Violations
                </span>
              </div>
            </CardHeader>
            <div className="px-6 pb-6 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    faceVisible ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div>
                  <p className="text-sm font-medium">Keep your face visible</p>
                  <p className="text-xs text-gray-500">Ensure your face is clearly visible to the camera</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    tabActive ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div>
                  <p className="text-sm font-medium">Stay on this tab</p>
                  <p className="text-xs text-gray-500">Do not switch tabs or applications</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    isMicrophoneActive ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                </div>
                <div>
                  <p className="text-sm font-medium">Minimize background noise</p>
                  <p className="text-xs text-gray-500">Find a quiet environment</p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs flex items-center justify-center"
                  onClick={() => setShowViolations(!showViolations)}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {showViolations ? 'Hide Violations' : 'View Violation Details'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Violation Report Panel */}
      {showViolations && (
        <div className="mt-6">
          <ViolationReport 
            violations={violations}
            metrics={{
              face_confidence: metrics?.face_confidence ?? 0,
              gaze_score: metrics?.gaze_score ?? 0,
              objects_detected: metrics?.objects_detected ?? 0,
              voice_activity_level: metrics?.voice_activity_level ?? 0,
            }}
          />
        </div>
      )}
    </div>
  );
};
