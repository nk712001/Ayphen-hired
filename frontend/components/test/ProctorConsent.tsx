"use client";

import React, { useState } from 'react';
import { Button } from '../ui';
import { Card, CardContent } from '../ui/card';

interface ProctorConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const ProctorConsent: React.FC<ProctorConsentProps> = ({
  onAccept,
  onDecline,
}) => {
  const [hasReadTerms, setHasReadTerms] = useState(false);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Proctoring Consent</h2>
          <p className="mt-2 text-gray-600">
            Please review and accept the proctoring terms before starting the test
          </p>
        </div>

        <div className="space-y-4 text-gray-700">
          <h3 className="font-semibold">During this test, we will:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access your camera and microphone for proctoring</li>
            <li>Monitor your face and eye movements</li>
            <li>Detect additional faces or people in the frame</li>
            <li>Listen for suspicious sounds or conversations</li>
            <li>Record parts of your session for review if violations are detected</li>
            <li>Monitor browser activity and prevent tab switching</li>
          </ul>

          <h3 className="font-semibold mt-6">Your Privacy</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Recordings are only made when violations are detected</li>
            <li>All data is encrypted and stored securely</li>
            <li>Recordings are automatically deleted after 30 days</li>
            <li>Your data is only used for test integrity verification</li>
          </ul>
        </div>

        <div className="pt-4 border-t">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={hasReadTerms}
              onChange={(e) => setHasReadTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">
              I have read and understand the proctoring terms
            </span>
          </label>
        </div>

        <div className="flex space-x-4">
          <Button
            variant="danger"
            onClick={onDecline}
            className="flex-1"
          >
            Decline & Exit
          </Button>
          <Button
            onClick={onAccept}
            disabled={!hasReadTerms}
            className="flex-1"
          >
            Accept & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
