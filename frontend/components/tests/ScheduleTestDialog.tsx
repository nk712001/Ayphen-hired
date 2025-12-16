'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Send } from 'lucide-react';

interface ScheduleTestDialogProps {
    testId: string;
    assignmentId: string;
    testTitle: string;
    candidateName: string;
    candidateEmail: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ScheduleTestDialog({
    testId,
    assignmentId,
    testTitle,
    candidateName,
    candidateEmail,
    onClose,
    onSuccess
}: ScheduleTestDialogProps) {
    const [scheduledStartTime, setScheduledStartTime] = useState('');
    const [scheduledEndTime, setScheduledEndTime] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!scheduledStartTime || !scheduledEndTime) {
            setError('Please select both start and end times');
            return;
        }

        const startTime = new Date(scheduledStartTime);
        const endTime = new Date(scheduledEndTime);
        const now = new Date();

        if (startTime >= endTime) {
            setError('End time must be after start time');
            return;
        }

        if (startTime < now) {
            setError('Start time must be in the future');
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch(`/api/tests/${testId}/assignments/${assignmentId}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheduledStartTime: startTime.toISOString(),
                    scheduledEndTime: endTime.toISOString(),
                    sendEmailNotification: sendEmail
                })
            });

            if (response.ok) {
                onSuccess();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to schedule test');
            }
        } catch (err) {
            console.error('Error scheduling test:', err);
            setError('Failed to schedule test');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get minimum datetime (current time + 1 hour)
    const getMinDateTime = () => {
        const min = new Date();
        min.setHours(min.getHours() + 1);
        return min.toISOString().slice(0, 16);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Schedule Test</h2>
                        <p className="text-sm text-gray-500 mt-1">Set a time window for the candidate to take the test</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Test Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Test</p>
                                <p className="font-medium text-gray-900">{testTitle}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Candidate</p>
                                <p className="font-medium text-gray-900">{candidateName}</p>
                                <p className="text-xs text-gray-500">{candidateEmail}</p>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Time Selection */}
                    <div className="space-y-6 mb-6">
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span>Test Window Opens</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledStartTime}
                                onChange={(e) => setScheduledStartTime(e.target.value)}
                                min={getMinDateTime()}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#de065d] focus:border-transparent"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Candidate can start the test from this time
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>Test Window Closes</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledEndTime}
                                onChange={(e) => setScheduledEndTime(e.target.value)}
                                min={scheduledStartTime || getMinDateTime()}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#de065d] focus:border-transparent"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Candidate must start the test before this time
                            </p>
                        </div>
                    </div>

                    {/* Email Notification */}
                    <div className="mb-6">
                        <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={sendEmail}
                                onChange={(e) => setSendEmail(e.target.checked)}
                                className="rounded border-gray-300 text-[#de065d] focus:ring-[#de065d] w-5 h-5"
                            />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <Send className="h-4 w-4 text-gray-600" />
                                    <span className="font-medium text-gray-900">Send email notification</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Candidate will receive an email with the test schedule and access link
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Preview */}
                    {scheduledStartTime && scheduledEndTime && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 mb-2">Schedule Preview</p>
                            <div className="space-y-1 text-sm text-blue-800">
                                <p>
                                    <strong>Opens:</strong> {new Date(scheduledStartTime).toLocaleString()}
                                </p>
                                <p>
                                    <strong>Closes:</strong> {new Date(scheduledEndTime).toLocaleString()}
                                </p>
                                <p className="text-xs text-blue-600 mt-2">
                                    Window duration: {Math.round((new Date(scheduledEndTime).getTime() - new Date(scheduledStartTime).getTime()) / (1000 * 60 * 60))} hours
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{ backgroundColor: '#de065d' }}
                            className="flex-1 px-4 py-2.5 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-opacity"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                                    Scheduling...
                                </>
                            ) : (
                                'Schedule Test'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
