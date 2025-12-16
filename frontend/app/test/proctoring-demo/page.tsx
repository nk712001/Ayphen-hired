'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProctoringConsent } from '@/components/proctoring/proctoring-consent';
import { TestProctoring } from '@/components/proctoring/test-proctoring';
import { ProctoringProvider } from '@/lib/proctoring/proctoring-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function ProctoringDemoPage() {
  const router = useRouter();
  const [hasConsent, setHasConsent] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const handleConsent = () => {
    setHasConsent(true);
    setTestStarted(true);
  };

  const handleDecline = () => {
    router.push('/dashboard');
  };

  const handleTestComplete = () => {
    setTestStarted(false);
  };

  return (
    <ProctoringProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="pt-4"></div>
        <div className="container mx-auto p-4 pt-12">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 !bg-white hover:!bg-gray-100 hover:!border-gray-500 hover:!shadow-lg !border-gray-300 !text-gray-700 hover:!text-gray-800 shadow-sm transform hover:scale-105 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>AI Proctoring Demo</CardTitle>
            <CardDescription>
              This is a demo of the AI proctoring system. Please grant the necessary permissions to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasConsent ? (
              <div className="space-y-6">
                <p>
                  This demo showcases the AI-powered proctoring system that monitors test-taking sessions 
                  for integrity and security. The system includes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Real-time face detection and verification</li>
                  <li>Gaze tracking to ensure focus on the test</li>
                  <li>Audio monitoring for background noise</li>
                  <li>Browser tab/window focus monitoring</li>
                  <li>Screen sharing detection</li>
                  <li>Violation logging and reporting</li>
                </ul>
                
                <div className="pt-4">
                  <Button onClick={() => setHasConsent(true)}>
                    Start Proctoring Demo
                  </Button>
                </div>
              </div>
            ) : !testStarted ? (
              <ProctoringConsent 
                onConsent={handleConsent}
                onDecline={handleDecline}
              />
            ) : (
              <div className="space-y-6">
                <TestProctoring />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleTestComplete}
                    variant="outline"
                  >
                    End Test
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {!testStarted && (
          <div className="mt-8 pb-8">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium">1. Camera & Microphone</h3>
                <p className="text-sm text-muted-foreground">
                  The system uses your camera to verify your identity and ensure you remain in frame during the test.
                  The microphone monitors for any suspicious sounds or voices.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">2. Gaze & Focus</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced algorithms track your eye movements to ensure you're focused on the test and not looking away 
                  from the screen for extended periods.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">3. Environment</h3>
                <p className="text-sm text-muted-foreground">
                  The system detects changes in your testing environment, including people entering the room or 
                  unauthorized materials being used.
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </ProctoringProvider>
  );
}
