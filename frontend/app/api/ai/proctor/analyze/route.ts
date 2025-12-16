import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { sessionId, frameData, secondaryFrameData } = data;

        if (!sessionId || !frameData) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://127.0.0.1:8000';
        // Use IP to avoid localhost resolution issues
        const targetUrl = `${aiServiceUrl.replace('localhost', '127.0.0.1')}/api/primary-camera-analysis/${sessionId}`;

        // Agent to ignore self-signed certs
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        console.log(`🤖 Proxying analysis request to ${targetUrl}`);
        console.log(`   Frame size: ${frameData?.length}, Secondary: ${!!secondaryFrameData ? secondaryFrameData.length : 'none'}`);

        // Prepare payload with optional secondary data
        // Aligning with WebSocket protocol: 'data' and 'secondary_data'
        const payload: any = {
            data: frameData,
            timestamp: new Date().toISOString()
        };
        if (secondaryFrameData) {
            payload.secondary_data = secondaryFrameData;
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            // @ts-ignore
            agent: agent
        });

        if (!response.ok) {
            console.error(`AI Service HTTP Proxy error: ${response.status}`);
            return NextResponse.json(
                { error: `AI Service returned ${response.status}` },
                { status: response.status }
            );
        }

        const result = await response.json();
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('AI Proctor Proxy Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
