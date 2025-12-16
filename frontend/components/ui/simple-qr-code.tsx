import React, { useEffect, useRef, useState } from 'react';
// Use dynamic import for client-side only code
import dynamic from 'next/dynamic';
import Image from 'next/image';

interface SimpleQRCodeProps {
  value: string;
  size?: number;
}

// Create a client-side only component
export const SimpleQRCode: React.FC<SimpleQRCodeProps> = ({ value, size = 250 }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Only run on client-side
  useEffect(() => {
    setIsMounted(true);

    // Import QRCode only on client side
    const generateQR = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import qrcode
        const QRCode = (await import('qrcode')).default;

        // Generate QR code as data URL
        const url = await QRCode.toDataURL(value, {
          width: size,
          margin: 4,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        setDataUrl(url);
        setIsLoading(false);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
        setIsLoading(false);
      }
    };

    if (isMounted) {
      generateQR();
    }

    return () => {
      setIsMounted(false);
    };
  }, [value, size, isMounted]);

  return (
    <div className="bg-white p-4 rounded-lg flex flex-col items-center justify-center border-4 border-blue-600 shadow-lg">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          <p className="mt-4 text-blue-700 font-medium">Generating QR Code...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
          <div className="text-red-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <div className="mt-4 text-sm text-center font-mono break-all overflow-hidden p-2 bg-gray-100 rounded w-full">
            {value}
          </div>
        </div>
      ) : dataUrl ? (
        <div className="flex flex-col items-center">
          <Image src={dataUrl} alt="QR Code" width={size} height={size} unoptimized />
          <div className="mt-2 text-xs text-blue-700 font-medium text-center">
            Scan with your mobile device camera
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
          <p className="text-blue-700 font-medium">QR Code not available</p>
          <div className="mt-4 text-sm text-center font-mono break-all overflow-hidden p-2 bg-gray-100 rounded w-full">
            {value}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleQRCode;
