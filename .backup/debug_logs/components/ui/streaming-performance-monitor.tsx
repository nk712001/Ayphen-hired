import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export interface StreamingMetrics {
  frameRate: number;
  targetFPS: number;
  latency: number;
  droppedFrames: number;
  totalFrames: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  bandwidth: number;
  jitter: number;
}

interface StreamingPerformanceMonitorProps {
  metrics: StreamingMetrics;
  isVisible?: boolean;
  compact?: boolean;
}

export const StreamingPerformanceMonitor: React.FC<StreamingPerformanceMonitorProps> = ({
  metrics,
  isVisible = true,
  compact = false
}) => {
  const [performanceHistory, setPerformanceHistory] = useState<number[]>([]);
  const [alertLevel, setAlertLevel] = useState<'none' | 'warning' | 'critical'>('none');

  // Update performance history
  useEffect(() => {
    setPerformanceHistory(prev => {
      const newHistory = [...prev, metrics.frameRate];
      return newHistory.slice(-30); // Keep last 30 measurements
    });

    // Determine alert level
    const fpsRatio = metrics.frameRate / metrics.targetFPS;
    if (fpsRatio < 0.7) {
      setAlertLevel('critical');
    } else if (fpsRatio < 0.9 || metrics.latency > 200) {
      setAlertLevel('warning');
    } else {
      setAlertLevel('none');
    }
  }, [metrics.frameRate, metrics.targetFPS, metrics.latency]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'disconnected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertIcon = () => {
    switch (alertLevel) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'none': return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (!isVisible) return null;

  if (compact) {
    return (
      <div className="flex items-center space-x-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm">
        <div className="flex items-center space-x-1">
          <Activity className="h-3 w-3" />
          <span>{metrics.frameRate.toFixed(1)} FPS</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{metrics.latency}ms</span>
        </div>
        <div className="flex items-center space-x-1">
          <Wifi className="h-3 w-3" />
          <span className="capitalize">{metrics.connectionQuality}</span>
        </div>
        {getAlertIcon()}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Streaming Performance
          </span>
          {getAlertIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Frame Rate */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.frameRate.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">
              FPS (Target: {metrics.targetFPS})
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  metrics.frameRate >= metrics.targetFPS * 0.9 ? 'bg-green-500' :
                  metrics.frameRate >= metrics.targetFPS * 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (metrics.frameRate / metrics.targetFPS) * 100)}%` }}
              />
            </div>
          </div>

          {/* Latency */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.latency}
            </div>
            <div className="text-sm text-gray-600">Latency (ms)</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  metrics.latency < 100 ? 'bg-green-500' :
                  metrics.latency < 200 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, 100 - (metrics.latency / 500) * 100)}%` }}
              />
            </div>
          </div>

          {/* Total Frames */}
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.totalFrames.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Frames</div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.droppedFrames} dropped
            </div>
          </div>

          {/* Connection Quality */}
          <div className="text-center">
            <Badge className={`text-sm ${getQualityColor(metrics.connectionQuality)}`}>
              {metrics.connectionQuality.toUpperCase()}
            </Badge>
            <div className="text-sm text-gray-600 mt-1">Connection</div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.bandwidth.toFixed(1)} Mbps
            </div>
          </div>
        </div>

        {/* Performance Graph */}
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Frame Rate History (Last 30 measurements)
          </div>
          <div className="flex items-end space-x-1 h-16 bg-gray-50 rounded p-2">
            {performanceHistory.map((fps, index) => (
              <div
                key={index}
                className={`flex-1 rounded-t transition-all duration-300 ${
                  fps >= metrics.targetFPS * 0.9 ? 'bg-green-400' :
                  fps >= metrics.targetFPS * 0.7 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ 
                  height: `${Math.max(4, (fps / metrics.targetFPS) * 100)}%`,
                  opacity: 0.3 + (index / performanceHistory.length) * 0.7
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 FPS</span>
            <span>{metrics.targetFPS} FPS (Target)</span>
          </div>
        </div>

        {/* Performance Alerts */}
        {alertLevel !== 'none' && (
          <div className={`mt-4 p-3 rounded-lg ${
            alertLevel === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`h-4 w-4 mt-0.5 mr-2 ${
                alertLevel === 'critical' ? 'text-red-500' : 'text-yellow-500'
              }`} />
              <div>
                <div className={`font-medium ${
                  alertLevel === 'critical' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {alertLevel === 'critical' ? 'Critical Performance Issue' : 'Performance Warning'}
                </div>
                <div className={`text-sm mt-1 ${
                  alertLevel === 'critical' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {alertLevel === 'critical' ? (
                    `Frame rate is significantly below target (${metrics.frameRate.toFixed(1)}/${metrics.targetFPS} FPS). Check network connection.`
                  ) : (
                    `Performance is below optimal. Current: ${metrics.frameRate.toFixed(1)} FPS, Latency: ${metrics.latency}ms`
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">Jitter:</span> {metrics.jitter.toFixed(1)}ms
          </div>
          <div>
            <span className="font-medium">Drop Rate:</span> {
              metrics.totalFrames > 0 ? 
              ((metrics.droppedFrames / metrics.totalFrames) * 100).toFixed(2) : 0
            }%
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
