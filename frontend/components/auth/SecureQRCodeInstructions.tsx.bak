import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, Globe, AlertCircle } from 'lucide-react';

export const SecureQRCodeInstructions: React.FC = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isSecureContext = typeof window !== 'undefined' && 
    (window.isSecureContext || 
     window.location.protocol === 'https:' || 
     ['localhost', '127.0.0.1'].includes(window.location.hostname));
  
  return (
    <div className="space-y-4 mt-4 max-w-md mx-auto">
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700">Instructions</AlertTitle>
        <AlertDescription className="text-blue-600 text-sm">
          <ol className="list-decimal pl-4 space-y-2 mt-2">
            <li>Scan the QR code with your mobile device's camera app</li>
            <li>Allow camera access when prompted</li>
            <li>Keep the mobile camera page open during the entire session</li>
            <li>Position your phone to show your workspace and hands</li>
          </ol>
        </AlertDescription>
      </Alert>
      
      {!isSecureContext && !isDevelopment && (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Secure Context Required</AlertTitle>
          <AlertDescription className="text-sm">
            Camera access requires a secure context (HTTPS). Please access this page via HTTPS.
          </AlertDescription>
        </Alert>
      )}
      
      {typeof window !== 'undefined' && window.location.protocol === 'http:' && !isDevelopment && (
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertTitle>HTTPS Required</AlertTitle>
          <AlertDescription className="text-sm">
            You're using HTTP. Please switch to HTTPS to enable camera access.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SecureQRCodeInstructions;
