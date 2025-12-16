import React from 'react';
import { Card } from '../ui';

interface Violation {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  message?: string;
  details?: any;
}

interface ViolationReportProps {
  violations: Violation[];
  metrics: {
    face_confidence: number;
    gaze_score: number;
    objects_detected: number;
    voice_activity_level?: number;
  };
}

export const ViolationReport: React.FC<ViolationReportProps> = ({
  violations,
  metrics,
}) => {
  const getSeverityColor = (severity: Violation['severity']): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatViolationType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatConfidence = (confidence?: number): string => {
    if (confidence === undefined || confidence === null || isNaN(confidence)) return 'N/A';
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const getViolationMetric = (violation: Violation): string => {
    // For specific violation types, show relevant metrics instead of confidence
    switch (violation.type.toLowerCase()) {
      case 'movement':
      case 'excessive_movement':
        return 'Detected';
      case 'no_face':
      case 'face_not_detected':
        return 'Missing';
      case 'gaze_violation':
      case 'gaze_away':
      case 'looking_away':
        return metrics.gaze_score !== undefined && metrics.gaze_score !== null && !isNaN(metrics.gaze_score)
          ? `${(metrics.gaze_score * 100).toFixed(1)}% Focus`
          : 'N/A';
      case 'multiple_faces':
        return `${metrics.objects_detected} Faces`;
      case 'tab_switch':
        return 'Switched Away';
      default:
        return formatConfidence(violation.confidence);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Proctoring Report</h3>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Face Confidence</p>
          <p className="text-lg font-medium text-gray-900">
            {metrics.face_confidence !== undefined && metrics.face_confidence !== null && !isNaN(metrics.face_confidence) 
              ? formatConfidence(metrics.face_confidence)
              : 'Not Detected'}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Attention Score</p>
          <p className="text-lg font-medium text-gray-900">
            {formatConfidence(metrics.gaze_score)}
          </p>
        </div>
      </div>

      {/* Active Violations */}
      {violations.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Active Violations</h4>
          {violations.map((violation, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getSeverityColor(violation.severity)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{formatViolationType(violation.type)}</p>
                  {violation.message && (
                    <p className="text-sm mt-1">{violation.message}</p>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {getViolationMetric(violation)}
                </span>
              </div>
              {violation.details && (
                <div className="mt-2 text-sm">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(violation.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg">
          No violations detected
        </div>
      )}

      {/* Additional Metrics */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Objects Detected</p>
            <p className="text-lg font-medium text-gray-900">
              {metrics.objects_detected}
            </p>
          </div>
          {metrics.voice_activity_level !== undefined && (
            <div>
              <p className="text-sm text-gray-500">Voice Activity</p>
              <p className="text-lg font-medium text-gray-900">
                {formatConfidence(metrics.voice_activity_level)}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
