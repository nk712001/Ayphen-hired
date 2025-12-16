'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Mic, Monitor, CheckCircle, AlertCircle, QrCode, Calendar, Clock, Lock } from 'lucide-react';
import QRCode from 'qrcode';
import { MicrophoneTest } from '@/components/setup/MicrophoneTest';
import TestSession from '@/components/tests/TestSession';
import { Loader2 } from 'lucide-react';

interface AssessFlowProps {
    test: {
        id: string;
        title: string;
        description?: string;
        duration: number;
        mcqQuestions: number;
        conversationalQuestions: number;
        codingQuestions: number;
        requiresSecondaryCamera: boolean;
        questions: any[];
    };
    assignment: {
        id: string;
        uniqueLink: string;
        isScheduled: boolean;
        scheduledStartTime?: Date | null;
        scheduledEndTime?: Date | null;
        answers: any[];
    };
    token: string;
}

export default function AssessFlow({ test, assignment, token }: AssessFlowProps) {
    // State: 'SETUP' | 'TEST'
    const [phase, setPhase] = useState<'SETUP' | 'TEST'>('SETUP');

    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [micStream, setMicStream] = useState<MediaStream | null>(null);
    const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
    const [secondaryCameraQrUrl, setSecondaryCameraQrUrl] = useState<string>('');
    const [showSecondaryCameraQr, setShowSecondaryCameraQr] = useState(false);
    const [mobileConnected, setMobileConnected] = useState(false);
    const [mobileSessionId, setMobileSessionId] = useState<string>('');
    const [checkingMobileConnection, setCheckingMobileConnection] = useState(false);
    const [showMicTest, setShowMicTest] = useState(false);
    const [micTestComplete, setMicTestComplete] = useState(false);
    const [setupComplete, setSetupComplete] = useState(false);
    const [isLoadingSetup, setIsLoadingSetup] = useState(false);

    // Auto-setup camera on mount
    useEffect(() => {
        setupCamera();
        if (test.requiresSecondaryCamera) {
            generateSecondaryCameraQr(test.id);
        }
    }, []);

    const setupCamera = async () => {
        try {
            const constraints = {
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    facingMode: 'user'
                },
                audio: true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setCameraStream(stream);
            setMicStream(stream);
            return true;
        } catch (error) {
            console.error('Camera setup failed:', error);
            // Try with basic constraints
            try {
                const basicStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                setCameraStream(basicStream);
                setMicStream(basicStream);
                return true;
            } catch (basicError) {
                console.error('Basic camera setup also failed:', basicError);
                return false;
            }
        }
    };

    const setupScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            setScreenShareStream(stream);
            return true;
        } catch (error) {
            console.error('Screen sharing setup failed:', error);
            return false;
        }
    };

    const [networkIp, setNetworkIp] = useState<string>('');

    const getNetworkIp = async () => {
        try {
            // Try to get network IP from a simple API endpoint
            const response = await fetch('/api/network-ip');
            if (response.ok) {
                const data = await response.json();
                setNetworkIp(data.ip);
                return data.ip;
            }
        } catch (error) {
            console.error('Failed to get network IP:', error);
        }

        // Fallback to localhost
        const fallbackIp = window.location.hostname;
        setNetworkIp(fallbackIp);
        return fallbackIp;
    };

    const generateSecondaryCameraQr = async (testId: string) => {
        try {
            // Wait for network IP if not available yet
            let ip = networkIp;
            if (!ip) {
                console.log('Network IP not available, fetching...');
                ip = await getNetworkIp();
            }

            // Use network IP if available, otherwise fallback to hostname
            const host = ip || window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : '';
            const protocol = window.location.protocol;

            const sessionId = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            setMobileSessionId(sessionId);

            const secondaryCameraUrl = `${protocol}//${host}${port}/mobile-camera/${testId}?sessionId=${sessionId}`;


            const qrDataUrl = await QRCode.toDataURL(secondaryCameraUrl);
            setSecondaryCameraQrUrl(qrDataUrl);

            startMobileConnectionCheck(sessionId);
        } catch (error) {
            console.error('Failed to generate secondary camera QR code:', error);
        }
    };

    const startMobileConnectionCheck = (sessionId: string) => {
        setCheckingMobileConnection(true);
        const checkInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/mobile-connection-status/${sessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.connected) {
                        setMobileConnected(true);
                        setCheckingMobileConnection(false);
                        clearInterval(checkInterval);
                    }
                }
            } catch (error) {
                console.error('Error checking mobile connection:', error);
            }
        }, 2000);

        setTimeout(() => {
            clearInterval(checkInterval);
            setCheckingMobileConnection(false);
        }, 300000);
    };

    const handleStartTest = async () => {
        // Final verification
        const cameraOk = !!cameraStream;
        const screenShareOk = !!screenShareStream;
        const secondaryCameraOk = !test.requiresSecondaryCamera || mobileConnected;
        const micTestRequired = (test.conversationalQuestions || 0) > 0;
        const micTestOk = !micTestRequired || micTestComplete;

        if (cameraOk && screenShareOk && secondaryCameraOk && micTestOk) {
            setSetupComplete(true);
            setPhase('TEST');
        } else {
            let message = 'Please complete the following requirements:\n';
            if (!cameraOk) message += '• Enable primary camera\n';
            if (!screenShareOk) message += '• Enable screen sharing\n';
            if (!secondaryCameraOk) message += '• Connect mobile camera by scanning QR code\n';
            if (!micTestOk) message += '• Complete microphone test\n';
            alert(message);
        }
    };

    // Scheduled Time Checks
    if (assignment.isScheduled && assignment.scheduledStartTime && assignment.scheduledEndTime) {
        const now = new Date();
        const start = new Date(assignment.scheduledStartTime);
        const end = new Date(assignment.scheduledEndTime);

        if (now < start) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg border-t-4 border-primary p-10 max-w-lg w-full text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">Test Upcoming</h1>
                        <p className="text-gray-600 mb-8 text-lg">
                            This test is scheduled to start on <br />
                            <span className="font-bold text-primary">{start.toLocaleString()}</span>
                        </p>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                            Please return to this page at the scheduled time.
                        </div>
                    </div>
                </div>
            );
        }

        if (now > end) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg border-t-4 border-red-500 p-10 max-w-lg w-full text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">Test Window Closed</h1>
                        <p className="text-gray-600 mb-8 text-lg">
                            This test was scheduled until <span className="font-semibold">{end.toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            );
        }
    }

    // RENDER: TEST PHASE
    if (phase === 'TEST') {
        const initialTimeRemaining = test.duration * 60; // Or better calculation if resumed
        return (
            <TestSession
                test={test}
                initialAttemptId={assignment.id}
                initialTimeRemaining={initialTimeRemaining}
                initialAnswers={assignment.answers.map(a => ({
                    questionId: a.questionId,
                    content: a.content
                }))}
                token={token}
            />
        );
    }

    // RENDER: SETUP PHASE
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">{test.title}</h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">Please review the instructions and set up your environment.</p>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-primary">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        {/* Left Column: Info */}
                        <div className="p-8 lg:p-10 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                                    Overview
                                </h2>
                                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                        <span className="text-gray-600 font-medium">Duration</span>
                                        <span className="font-bold text-gray-900 flex items-center">
                                            <Clock className="w-4 h-4 mr-2 text-primary" />
                                            {test.duration} minutes
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                        <span className="text-gray-600 font-medium">Questions</span>
                                        <span className="font-bold text-gray-900">
                                            {test.questions.length} Total
                                        </span>
                                    </div>
                                    <div className="pt-2">
                                        <div className="grid grid-cols-3 gap-3">
                                            {test.mcqQuestions > 0 && (
                                                <div className="text-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                    <div className="font-bold text-2xl text-primary">{test.mcqQuestions}</div>
                                                    <div className="text-xs text-gray-500 font-medium mt-1">MCQ</div>
                                                </div>
                                            )}
                                            {test.conversationalQuestions > 0 && (
                                                <div className="text-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                    <div className="font-bold text-2xl text-primary">{test.conversationalQuestions}</div>
                                                    <div className="text-xs text-gray-500 font-medium mt-1">Speaking</div>
                                                </div>
                                            )}
                                            {test.codingQuestions > 0 && (
                                                <div className="text-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                    <div className="font-bold text-2xl text-primary">{test.codingQuestions}</div>
                                                    <div className="text-xs text-gray-500 font-medium mt-1">Coding</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: System Check */}
                        <div className="p-8 lg:p-10 flex flex-col justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                                    System Check
                                </h2>

                                <div className="space-y-4">
                                    {/* Camera Check */}
                                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${cameraStream ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${cameraStream ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                <Camera className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">Webcam</div>
                                                <div className="text-xs text-gray-500">{cameraStream ? 'Connected' : 'Access Required'}</div>
                                            </div>
                                        </div>
                                        {cameraStream ? <CheckCircle className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>}
                                    </div>

                                    {/* Mic Check */}
                                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${micStream && micTestComplete ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${micStream && micTestComplete ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                <Mic className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">Microphone</div>
                                                <div className="text-xs text-gray-500">
                                                    {(test.conversationalQuestions || 0) > 0 ? (micTestComplete ? 'Verified' : 'Test Required') : 'Optional'}
                                                </div>
                                            </div>
                                        </div>
                                        {(test.conversationalQuestions || 0) > 0 && !micTestComplete ? (
                                            <button onClick={() => setShowMicTest(true)} className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">Test</button>
                                        ) : (
                                            micStream && micTestComplete && <CheckCircle className="w-6 h-6 text-green-500" />
                                        )}
                                    </div>

                                    {/* Screen Share Check */}
                                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${screenShareStream ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${screenShareStream ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                <Monitor className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">Screen Share</div>
                                                <div className="text-xs text-gray-500">{screenShareStream ? 'Active' : 'Required'}</div>
                                            </div>
                                        </div>
                                        {!screenShareStream ? (
                                            <button onClick={setupScreenShare} className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">Enable</button>
                                        ) : (
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        )}
                                    </div>

                                    {/* Mobile Camera Check */}
                                    {test.requiresSecondaryCamera && (
                                        <div className={`flex flex-col p-4 rounded-xl border transition-all ${mobileConnected ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-gray-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-2 rounded-full ${mobileConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        <QrCode className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">Mobile Camera</div>
                                                        <div className="text-xs text-gray-500">{mobileConnected ? 'Connected' : 'Scan to Connect'}</div>
                                                    </div>
                                                </div>
                                                {mobileConnected ? <CheckCircle className="w-6 h-6 text-green-500" /> : (
                                                    <button onClick={() => setShowSecondaryCameraQr(!showSecondaryCameraQr)} className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                                                        {showSecondaryCameraQr ? 'Hide QR' : 'Show QR'}
                                                    </button>
                                                )}
                                            </div>

                                            {showSecondaryCameraQr && secondaryCameraQrUrl && !mobileConnected && (
                                                <div className="mt-4 text-center border-t border-gray-100 pt-4">
                                                    <div className="bg-white p-2 inline-block rounded-lg border shadow-sm">
                                                        <Image src={secondaryCameraQrUrl} alt="Connect Mobile" width={128} height={128} className="w-32 h-32" unoptimized />
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">Scan with your phone</p>
                                                    {checkingMobileConnection && <p className="text-xs text-primary animate-pulse mt-1">Waiting for connection...</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Camera Preview */}
                                {cameraStream && (
                                    <div className="mt-6">
                                        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative shadow-inner">
                                            <video
                                                autoPlay
                                                muted
                                                ref={(video) => {
                                                    if (video && cameraStream) video.srcObject = cameraStream;
                                                }}
                                                className="w-full h-full object-cover transform scale-x-[-1]"
                                            />
                                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                                                Live Preview
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <button
                                    onClick={handleStartTest}
                                    disabled={isLoadingSetup}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    <span>Start Assessment</span>
                                    <div className="bg-white/20 p-1 rounded-full">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showMicTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
                        <MicrophoneTest
                            onComplete={() => {
                                setMicTestComplete(true);
                                setShowMicTest(false);
                            }}
                        />
                        <button
                            onClick={() => setShowMicTest(false)}
                            className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
