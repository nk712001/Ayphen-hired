'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProctoringProvider } from '@/lib/proctoring/proctoring-context';
import ThirdCameraSetup from '@/components/setup/ThirdCameraSetup';
import { MicrophoneTest } from '@/components/setup/MicrophoneTest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight } from 'lucide-react';
import { Steps, Step } from '../../components/ui/steps';

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSecondaryRequired, setIsSecondaryRequired] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Steps for the setup process
  const steps = [
    { id: 'welcome', title: 'Welcome' },
    { id: 'camera', title: 'Camera Setup' },
    { id: 'microphone', title: 'Microphone Test' },
    { id: 'complete', title: 'Complete' }
  ];

  // Check if the test requires a secondary camera
  const checkTestRequirements = async () => {
    try {
      // In a real implementation, this would fetch the test configuration
      // from the backend based on the test ID or assignment ID
      const response = await fetch('/api/tests/requirements', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setIsSecondaryRequired(data.requiresSecondaryCamera || false);
      }
    } catch (error) {
      console.error('Error fetching test requirements:', error);
      // Default to not required if there's an error
      setIsSecondaryRequired(false);
    }
  };

  // Call checkTestRequirements when the component mounts
  useEffect(() => {
    checkTestRequirements();
  }, []);

  // Handle step completion
  const handleStepComplete = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setSetupComplete(true);
    }
  };

  // Handle skipping the camera setup (if not required)
  const handleSkipCamera = () => {
    if (!isSecondaryRequired) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle completion of the entire setup process
  const handleSetupComplete = () => {
    router.push('/interview');
  };

  // Render the current step
  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <Card className="w-full max-w-3xl mx-auto shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-md rounded-xl border-primary-50">
            <CardHeader className="bg-gradient-to-r from-primary-500 to-primary text-white pb-6 relative overflow-hidden">
              {/* Header background decoration */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-md"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-md"></div>
                <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-yellow-500/10 rounded-full blur-lg"></div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Welcome to the Interview Setup</CardTitle>
              <CardDescription className="text-primary-100">
                Let&apos;s prepare your environment for the interview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
                <p className="text-primary-800">
                  Before starting the interview, we need to set up your camera and microphone
                  to ensure everything works correctly. This process will:
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-primary-100">
                <ul className="list-disc pl-5 space-y-3 text-gray-700">
                  <li>Configure your primary camera for face detection</li>
                  <li>Set up an optional secondary camera to monitor your workspace</li>
                  <li>Test your microphone and voice recognition capabilities</li>
                  <li>Ensure your environment is ready for the interview</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl p-5 border border-primary-200">
                <p className="text-primary-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Please make sure you&apos;re in a quiet environment with good lighting.
                  You&apos;ll need access to a webcam and microphone.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end bg-gray-50 border-t border-gray-100 py-4 px-6">
              <Button
                onClick={handleStepComplete}
                className="bg-gradient-to-r from-primary-500 to-primary hover:from-primary-600 hover:to-primary-dark text-white transition-colors flex items-center justify-center"
              >
                <span>Get Started</span> <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );

      case 'camera':
        return (
          <ThirdCameraSetup
            onComplete={handleStepComplete}
            onSkip={handleSkipCamera}
            isRequired={isSecondaryRequired}
          />
        );

      case 'microphone':
        return (
          <MicrophoneTest onComplete={handleStepComplete} />
        );

      case 'complete':
        return (
          <Card className="w-full max-w-3xl mx-auto shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-md rounded-xl border-primary-50">
            <CardHeader className="bg-gradient-to-r from-primary-500 to-primary text-white pb-6 relative overflow-hidden">
              {/* Header background decoration */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-md"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-md"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-yellow-500/20 to-transparent rounded-full blur-xl"></div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Setup Complete</CardTitle>
              <CardDescription className="text-primary-100">
                You&apos;re all set for your interview!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
              <div className="flex items-center justify-center">
                <div className="bg-gradient-to-r from-primary-100 to-primary-200 p-6 rounded-full shadow-inner">
                  <div className="bg-gradient-to-r from-primary-500 to-primary p-4 rounded-full shadow-lg">
                    <Check className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>

              <div className="text-center max-w-md mx-auto">
                <h3 className="font-semibold text-xl text-gray-800 mb-2">Ready to Begin</h3>
                <p className="text-gray-600">
                  Your camera and microphone are configured and ready for the interview.
                </p>
              </div>

              <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
                <h3 className="font-medium text-primary-900 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Important Reminders:
                </h3>
                <ul className="text-sm text-primary-800 space-y-2 pl-5 list-disc">
                  <li>Stay focused on the interview</li>
                  <li>Ensure your face remains visible</li>
                  <li>Speak clearly when answering questions</li>
                  <li>Do not use external resources unless specifically allowed</li>
                  <li>If you encounter technical issues, use the help button</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center bg-gray-50 border-t border-gray-100 py-6 px-6">
              <Button
                onClick={handleSetupComplete}
                className="bg-gradient-to-r from-primary-500 to-primary hover:from-primary-600 hover:to-primary-dark text-white py-6 px-8 text-lg font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <span>Start Interview</span>
              </Button>
            </CardFooter>
          </Card>
        );

      default:
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardContent>
              <p>Unknown step</p>
            </CardContent>
          </Card>
        );
    }
  }

  return (
    <ProctoringProvider>
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        {/* Background decoration with warm, eye-friendly colors and animations */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-100 blur-3xl opacity-30 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary-200 blur-3xl opacity-30 animate-pulse-slower"></div>
          <div className="absolute top-20 left-20 w-60 h-60 rounded-full bg-primary-100 blur-3xl opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-secondary-100 blur-3xl opacity-20 animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-primary-50/50 via-white to-secondary-50/50 blur-xl opacity-50"></div>
        </div>

        {/* Add animation styles */}
        <style jsx global>{`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.4; }
          }
          @keyframes pulse-slower {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.35; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          .animate-pulse-slow {
            animation: pulse-slow 8s ease-in-out infinite;
          }
          .animate-pulse-slower {
            animation: pulse-slower 12s ease-in-out infinite;
          }
          .animate-float {
            animation: float 10s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 15s ease-in-out infinite;
            animation-delay: 2s;
          }
        `}</style>

        <div className="container mx-auto py-8 px-4 relative z-10">
          <div className="mb-8">
            <Steps currentStep={currentStep} totalSteps={steps.length}>
              {steps.map((step, index) => (
                <Step key={step.id} title={step.title} completed={index < currentStep} />
              ))}
            </Steps>
          </div>

          {renderStep()}
        </div>
      </div>
    </ProctoringProvider>
  );
}
