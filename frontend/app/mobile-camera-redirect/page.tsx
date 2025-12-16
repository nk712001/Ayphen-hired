'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ExternalLink, Smartphone } from 'lucide-react';

export default function MobileCameraRedirect() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('sessionId') || '';
  const urlsParam = searchParams?.get('urls') || '';
  
  const [urls, setUrls] = useState<string[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    try {
      if (urlsParam) {
        try {
          // Try to parse the URLs as JSON
          const parsedUrls = JSON.parse(decodeURIComponent(urlsParam));
          setUrls(parsedUrls);
          
          // Auto-select the first URL
          if (parsedUrls.length > 0) {
            setSelectedUrl(parsedUrls[0]);
          }
        } catch (jsonError) {
          console.error('Error parsing URLs as JSON:', jsonError);
          
          // If JSON parsing fails, try to use the urlsParam directly as a single URL
          const directUrl = decodeURIComponent(urlsParam);
          if (directUrl.includes('http')) {
            console.log('Using direct URL:', directUrl);
            setUrls([directUrl]);
            setSelectedUrl(directUrl);
          } else {
            // If all else fails, create a direct link to the mobile-camera page
            const fallbackUrl = `/mobile-camera?sessionId=${sessionId}`;
            console.log('Using fallback URL:', fallbackUrl);
            setUrls([fallbackUrl]);
            setSelectedUrl(fallbackUrl);
          }
        }
      } else if (sessionId) {
        // If no URLs but we have a sessionId, create a direct link
        const directUrl = `/mobile-camera?sessionId=${sessionId}`;
        console.log('No URLs provided, using direct link:', directUrl);
        setUrls([directUrl]);
        setSelectedUrl(directUrl);
      } else {
        setError('No session ID or URLs provided');
      }
    } catch (e) {
      console.error('Error in URL processing:', e);
      
      // Last resort fallback - create a direct link
      if (sessionId) {
        const fallbackUrl = `/mobile-camera?sessionId=${sessionId}`;
        console.log('Error recovery: using fallback URL:', fallbackUrl);
        setUrls([fallbackUrl]);
        setSelectedUrl(fallbackUrl);
      } else {
        setError('Could not create a valid connection URL');
      }
    } finally {
      setIsLoading(false);
    }
    
    // Try to detect if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (!isMobile) {
      setError('This page is designed for mobile devices. Please scan the QR code with your mobile device.');
    }
  }, [urlsParam]);
  
  const handleConnect = () => {
    if (selectedUrl) {
      // Try to open the selected URL
      window.location.href = selectedUrl;
    }
  };
  
  const handleSelectUrl = (url: string) => {
    setSelectedUrl(url);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="mr-2 h-6 w-6" />
            Mobile Camera Connection
          </CardTitle>
          <CardDescription>
            Connect your mobile device as a secondary camera
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Select a connection option that works best for your network:
                </p>
                
                <div className="space-y-2">
                  {urls.map((url, index) => (
                    <div 
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between ${
                        selectedUrl === url ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => handleSelectUrl(url)}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          selectedUrl === url ? 'bg-blue-500' : 'bg-gray-200'
                        }`}></div>
                        <div className="text-sm truncate max-w-[200px]">{url}</div>
                      </div>
                      {selectedUrl === url && <ArrowRight className="h-4 w-4 text-blue-500" />}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
                <p className="font-medium">Session ID: {sessionId}</p>
                <p className="mt-1">Make sure you're connected to the same network as the main device.</p>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleConnect} 
            disabled={!selectedUrl || isLoading || !!error}
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect to Camera
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Having trouble connecting?</p>
        <p>Try a different option or make sure you're on the same network.</p>
      </div>
    </div>
  );
}
