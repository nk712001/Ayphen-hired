import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, Globe } from 'lucide-react';
import SimpleQRCode from '@/components/ui/simple-qr-code';

interface SecureQRCodeInstructionsProps {
  qrCodeUrl: string;
  mobileUrl?: string;
  isConnected?: boolean;
  isChecking?: boolean;
}

const SecureQRCodeInstructions: React.FC<SecureQRCodeInstructionsProps> = ({
  qrCodeUrl,
  mobileUrl = '',
  isConnected = false,
  isChecking = false,
}) => {
  const [qrCodeUrlValid, setQrCodeUrlValid] = useState(false);
  const [mobileUrlValid, setMobileUrlValid] = useState(false);
  const [isSecure, setIsSecure] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [isHttpProtocol, setIsHttpProtocol] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // Check if we're in development mode
    setIsDevelopment(process.env.NODE_ENV === 'development');
    
    // Check if we're in a secure context
    if (typeof window !== 'undefined') {
      setIsSecure(
        window.isSecureContext || 
        window.location.protocol === 'https:' || 
        ['localhost', '127.0.0.1'].includes(window.location.hostname)
      );
      
      setIsHttpProtocol(window.location.protocol === 'http:');
      
      // Check if we're on a mobile device
      setIsMobileDevice(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      
      // Check if we're on an iOS device
      setIsIOSDevice(/iPad|iPhone|iPod/.test(navigator.userAgent));
    }
    
    // Validate URLs
    setQrCodeUrlValid(Boolean(qrCodeUrl && qrCodeUrl.startsWith('http')));
    setMobileUrlValid(Boolean(mobileUrl && mobileUrl.startsWith('http')));
  }, [qrCodeUrl, mobileUrl]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {!isSecure && !isDevelopment && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start w-full">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Secure Context Required</p>
            <p className="text-sm mt-1">
              Camera access requires a secure connection (HTTPS). You are currently on HTTP.
            </p>
            <div className="mt-2 text-sm">
              <p className="font-medium">Options:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Use the direct link on your mobile device (tap button below)</li>
                <li>Deploy this app with HTTPS enabled</li>
                <li>Use a local HTTPS development server</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {isDevelopment && isHttpProtocol && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 p-3 rounded-lg mb-4 flex items-start w-full">
          <Globe className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Development Mode</p>
            <p className="text-sm mt-1">
              Running in development mode with HTTP. Camera access should work, but some browsers might still require HTTPS.
            </p>
          </div>
        </div>
      )}
      
      <p className="text-primary-800 text-sm text-center mb-4">
        {isSecure || isDevelopment
          ? "Scan this QR code with your mobile phone to use it as a secondary camera."
          : "Due to security restrictions, you may need to open the link directly on your mobile device:"}
      </p>
      
      {isMobileDevice && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 p-3 rounded-lg mb-4 w-full text-left">
          <p className="font-medium">You're on a mobile device</p>
          <p className="text-sm mt-1">
            It looks like you're already on a mobile device. You can:
          </p>
          <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
            <li>Open the link directly by tapping the button below</li>
            <li>Use this device as your secondary camera</li>
          </ul>
        </div>
      )}
      
      {isIOSDevice && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 p-3 rounded-lg mb-4 w-full text-left">
          <p className="font-medium">iOS Device Detected</p>
          <p className="text-sm mt-1">
            For iOS devices, make sure to:
          </p>
          <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
            <li>Use Safari browser for best camera compatibility</li>
            <li>Grant camera permissions when prompted</li>
            <li>Keep the page open during the entire session</li>
          </ul>
        </div>
      )}
      
      <div className="bg-white p-3 rounded-lg shadow-md mb-4 relative">
        {/* Connection status overlay */}
        {isChecking && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-lg">
            <div className="text-center text-white p-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
              <p className="font-medium">Connecting...</p>
              <p className="text-sm mt-1">Waiting for mobile device</p>
            </div>
          </div>
        )}
        
        {isConnected && (
          <div className="absolute inset-0 bg-green-500/80 z-10 flex items-center justify-center rounded-lg">
            <div className="text-center text-white p-4">
              <div className="rounded-full h-16 w-16 bg-white/20 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-lg">Connected!</p>
              <p className="text-sm mt-1">Mobile camera is ready</p>
            </div>
          </div>
        )}
        
        {/* QR Code */}
        {qrCodeUrl && qrCodeUrlValid ? (
          <div className="flex justify-center">
            <SimpleQRCode value={qrCodeUrl} size={250} />
          </div>
        ) : qrCodeUrl && !qrCodeUrlValid ? (
          <div className="w-48 h-48 flex items-center justify-center border border-gray-300 rounded bg-red-50">
            <div className="text-center p-2">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-medium">Invalid URL</p>
              <p className="text-red-600 text-xs mt-1">The QR code URL is invalid</p>
            </div>
          </div>
        ) : (
          <div className="w-48 h-48 flex items-center justify-center border border-gray-300 rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-gray-500">QR Code<br />Loading...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Always show the direct link button for easier access */}
      {mobileUrlValid ? (
        <a 
          href={mobileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md transition-colors mb-4 w-full"
          onClick={() => console.log('Opening mobile URL:', mobileUrl)}
        >
          Open Camera Link <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      ) : (
        <button 
          className="flex items-center justify-center bg-gray-400 text-white py-2 px-4 rounded-md mb-4 w-full cursor-not-allowed"
          disabled
          title="Invalid URL"
        >
          Invalid Camera Link <AlertTriangle className="ml-2 h-4 w-4" />
        </button>
      )}
      
      <div className="mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-200">
        <p className="font-medium mb-2 text-yellow-800">Having trouble connecting?</p>
        <p className="text-sm mb-3 text-yellow-700">
          Try one of these direct links on your mobile device:
        </p>
        
        {qrCodeUrl && qrCodeUrl.includes('sessionId=') && (
          <div className="space-y-3">
            <a 
              href={`/mobile-camera-direct?sessionId=${qrCodeUrl.split('sessionId=')[1]?.split('&')[0]}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-sm bg-white p-3 rounded border border-yellow-300 text-blue-600 hover:text-blue-800 hover:bg-yellow-50 transition-colors flex items-center justify-between"
            >
              <span>Direct Link (Same Device)</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            
            <div className="text-sm bg-white p-3 rounded border border-yellow-300">
              <p className="font-medium mb-1">Direct Link (Mobile Device):</p>
              <p className="break-all font-mono text-xs">
                {typeof window !== 'undefined' && 
                  `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/mobile-camera-direct?sessionId=${qrCodeUrl.split('sessionId=')[1]?.split('&')[0]}`
                }
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-primary-700">
        <p>After scanning or opening the link, allow camera access when prompted</p>
        {/* Debug info - show the actual URL */}
        {isDevelopment && (
          <div className="mt-4 p-2 bg-gray-100 rounded-md overflow-auto max-w-full">
            <p className="text-xs text-gray-500 break-all">{qrCodeUrl || 'No URL generated'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureQRCodeInstructions;
