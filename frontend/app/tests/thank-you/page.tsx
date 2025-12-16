'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

declare global {
  interface Window {
    localStream?: MediaStream;
    screenStream?: MediaStream;
  }
}

export default function ThankYouPage() {
  const router = useRouter();

  useEffect(() => {
    // Stop all active media streams immediately
    const stopAllStreams = () => {
      // Stop all video elements
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('Stopped track:', track.kind);
          });
          video.srcObject = null;
        }
      });

      // Also stop any global media streams
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }
      if (window.screenStream) {
        window.screenStream.getTracks().forEach(track => track.stop());
      }
    };

    stopAllStreams();

    // Also stop streams when page becomes visible (in case user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        stopAllStreams();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full text-center p-8">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Submitted Successfully!</h1>
          <p className="text-gray-600">
            Thank you for completing the assessment. Your responses have been recorded and will be reviewed by our team.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="font-medium text-gray-900 mb-2">What happens next?</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your responses will be reviewed by our team</li>
            <li>• You'll receive feedback within 2-3 business days</li>
            <li>• We'll contact you regarding next steps</li>
          </ul>
        </div>

        <button
          onClick={() => {
            // Aggressively stop all media streams
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
              if (video.srcObject) {
                const stream = video.srcObject as MediaStream;
                stream.getTracks().forEach(track => {
                  track.stop();
                  track.enabled = false;
                });
                video.srcObject = null;
                video.src = '';
              }
            });

            // Stop any global streams
            if (window.localStream) {
              window.localStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
              });
            }
            if (window.screenStream) {
              window.screenStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
              });
            }

            // Force garbage collection of media streams
            setTimeout(() => {
              router.push('/dashboard');
            }, 100);
          }}
          className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}