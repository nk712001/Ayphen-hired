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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Schedule Test</h2>
                        <p className="text-sm text-muted-foreground mt-1">Set a time window for the candidate to take the test</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Test Info */}
                    <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-border">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Test</p>
                                <p className="font-medium text-foreground">{testTitle}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Candidate</p>
                                <p className="font-medium text-foreground">{candidateName}</p>
                                <p className="text-xs text-muted-foreground">{candidateEmail}</p>
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
                            <label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Test Window Opens</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledStartTime}
                                onChange={(e) => setScheduledStartTime(e.target.value)}
                                min={getMinDateTime()}
                                className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Candidate can start the test from this time
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Test Window Closes</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledEndTime}
                                onChange={(e) => setScheduledEndTime(e.target.value)}
                                min={scheduledStartTime || getMinDateTime()}
                                className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Candidate must start the test before this time
                            </p>
                        </div>
                    </div>

                    {/* Email Notification */}
                    <div className="mb-6">
                        <label className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={sendEmail}
                                onChange={(e) => setSendEmail(e.target.checked)}
                                className="rounded border-input text-primary focus:ring-primary w-5 h-5"
                            />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <Send className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-foreground">Send email notification</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Candidate will receive an email with the test schedule and access link
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Preview */}
                    {scheduledStartTime && scheduledEndTime && (
                        <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-lg">
                            <p className="text-sm font-medium text-primary mb-2">Schedule Preview</p>
                            <div className="space-y-1 text-sm text-primary/80">
                                <p>
                                    <strong>Opens:</strong> {new Date(scheduledStartTime).toLocaleString()}
                                </p>
                                <p>
                                    <strong>Closes:</strong> {new Date(scheduledEndTime).toLocaleString()}
                                </p>
                                <p className="text-xs text-primary/70 mt-2">
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
                            className="flex-1 px-4 py-2.5 text-foreground bg-card border border-border rounded-lg hover:bg-muted font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 text-white bg-primary rounded-lg hover:bg-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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
