'use client';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
    useEffect(() => {
        console.error('Assessment Page Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
                <p className="text-gray-600 mb-6">We encountered an error while loading your assessment.</p>

                <div className="bg-gray-100 p-4 rounded-lg text-left text-xs font-mono mb-6 overflow-auto max-h-40 border border-gray-200">
                    <div className="font-semibold text-gray-700 mb-1">Error Details:</div>
                    {error.message || 'Unknown error occurred'}
                    {error.digest && <div className="mt-2 text-gray-500 border-t border-gray-200 pt-2">Digest: {error.digest}</div>}
                </div>

                <button
                    onClick={() => reset()}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
