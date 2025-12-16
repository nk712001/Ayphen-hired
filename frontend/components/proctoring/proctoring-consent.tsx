'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useProctoring } from '@/lib/proctoring/proctoring-context';

interface ProctoringConsentProps {
  onConsent: () => void;
  onDecline: () => void;
}

export const ProctoringConsent: React.FC<ProctoringConsentProps> = ({ onConsent, onDecline }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startProctoring } = useProctoring();

  const handleStartProctoring = async () => {
    try {
      await startProctoring();
      onConsent();
    } catch (err) {
      console.error('Failed to start proctoring:', err);
      setError('Failed to access camera or microphone. Please check your permissions and try again.');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Proctoring Consent</CardTitle>
        <CardDescription>
          Before starting the test, please review and accept the proctoring requirements.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <h3 className="font-medium">This test requires the following permissions:</h3>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="camera-toggle" className="text-base">
                Camera Access
              </Label>
              <p className="text-sm text-muted-foreground">
                Required for identity verification and monitoring during the test
              </p>
            </div>
            <Switch
              id="camera-toggle"
              checked={cameraEnabled}
              onCheckedChange={setCameraEnabled}
              disabled={!acceptedTerms}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="microphone-toggle" className="text-base">
                Microphone Access
              </Label>
              <p className="text-sm text-muted-foreground">
                Used to detect any unauthorized audio during the test
              </p>
            </div>
            <Switch
              id="microphone-toggle"
              checked={microphoneEnabled}
              onCheckedChange={setMicrophoneEnabled}
              disabled={!acceptedTerms}
            />
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="text-sm">
              <label htmlFor="terms" className="font-medium">
                I understand and agree to the proctoring requirements
              </label>
              <p className="text-muted-foreground">
                By checking this box, you acknowledge that your test session will be monitored and recorded for security purposes.
                Unauthorized behavior may result in test invalidation.
              </p>
            </div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <div>
            <AlertTitle>Important</AlertTitle>
            <AlertDescription className="text-sm">
              Please ensure you&apos;re in a well-lit, quiet environment. Close all other applications and browser tabs before starting the test.
              Any attempt to switch tabs or applications may be flagged as suspicious behavior.
            </AlertDescription>
          </div>
        </Alert>
      </CardContent>

      <CardFooter className="flex flex-row justify-between items-center gap-4">
        <Button
          variant="outline"
          onClick={onDecline}
          className="flex items-center !bg-white hover:!bg-gray-100 hover:!border-gray-500 hover:!shadow-lg !border-gray-300 !text-gray-700 hover:!text-gray-800 shadow-sm transform hover:scale-105 transition-all duration-200"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          onClick={handleStartProctoring}
          disabled={!acceptedTerms || (!cameraEnabled && !microphoneEnabled)}
          className="flex items-center bg-blue-600 hover:bg-blue-700 hover:shadow-lg text-white disabled:bg-gray-300 disabled:text-gray-500 transform hover:scale-105 transition-all duration-200 disabled:transform-none disabled:hover:shadow-none"
        >
          <Check className="mr-2 h-4 w-4" />
          Start Proctored Test
        </Button>
      </CardFooter>
    </Card>
  );
};
