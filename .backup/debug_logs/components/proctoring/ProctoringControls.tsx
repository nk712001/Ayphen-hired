'use client';

import React from 'react';
import { useProctoring } from '@/lib/proctoring/proctoring-context';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, AlertTriangle } from 'lucide-react';

export const ProctoringControls: React.FC = () => {
  const {
    isProctoringActive,
    isCameraActive,
    isMicrophoneActive,
    isScreenShared,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    violations,
  } = useProctoring();

  if (!isProctoringActive) return null;

  const hasCriticalViolations = violations.some(v => v.severity === 'critical');
  const hasWarnings = violations.some(v => v.severity === 'high' || v.severity === 'medium');

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">Proctoring Controls</h3>
            {(hasCriticalViolations || hasWarnings) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <AlertTriangle 
                        className={`h-5 w-5 ${hasCriticalViolations ? 'text-red-500' : 'text-yellow-500'}`} 
                      />
                      {violations.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {violations.length}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {hasCriticalViolations 
                      ? 'Critical proctoring violations detected!'
                      : 'Warning: Potential proctoring violations detected'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isCameraActive ? 'default' : 'outline'}
                    size="icon"
                    onClick={toggleCamera}
                    className="h-10 w-10"
                  >
                    {isCameraActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isCameraActive ? 'Turn off camera' : 'Turn on camera'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isMicrophoneActive ? 'default' : 'outline'}
                    size="icon"
                    onClick={toggleMicrophone}
                    className="h-10 w-10"
                  >
                    {isMicrophoneActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMicrophoneActive ? 'Mute microphone' : 'Unmute microphone'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isScreenShared ? 'default' : 'outline'}
                    size="icon"
                    onClick={toggleScreenShare}
                    className="h-10 w-10"
                  >
                    {isScreenShared ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isScreenShared ? 'Stop sharing screen' : 'Share screen'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {violations.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              {hasCriticalViolations 
                ? 'Critical violations detected! Please follow the test guidelines.'
                : 'Warning: Some proctoring violations detected'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
