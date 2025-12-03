import React from 'react';
// Use dynamic import to avoid issues with the library
import dynamic from 'next/dynamic';

// Dynamically import the QRCode component with no SSR
// Specify that we want the default export from the module
const QRCodeComponent = dynamic(
  () => import('qrcode.react').then((mod) => mod.default || mod),
  { ssr: false }
);

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;
}

// Create a simple div wrapper for the QR code
export const QRCode: React.FC<QRCodeProps> = (props) => {
  return (
    <div className="qrcode-wrapper">
      <QRCodeComponent {...props} />
    </div>
  );
};

export default QRCode;
