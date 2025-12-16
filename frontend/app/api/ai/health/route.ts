import { NextResponse } from 'next/server';
import https from 'https';

export async function GET() {
    try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://127.0.0.1:8000';
        // Use IP to avoid localhost resolution issues
        const url = `${aiServiceUrl.replace('localhost', '127.0.0.1')}/health`;

        // Create an agent that ignores self-signed certificates
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        console.log(`Checking AI Service health via proxy at: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            // @ts-ignore - undici/fetch supports dispatcher/agent but types might vary
            agent: agent,
            // For Next.js fetch
            next: { revalidate: 0 }
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({ status: 'ok', serviceStatus: data });
        } else {
            console.error(`AI Service returned ${response.status}`);
            return NextResponse.json({ status: 'error', statusCode: response.status }, { status: 502 });
        }
    } catch (error: any) {
        console.error('Proxy Health Check Failed:', error.message);
        return NextResponse.json({
            status: 'error',
            message: 'Failed to connect to AI Service',
            details: error.message
        }, { status: 500 });
    }
}
