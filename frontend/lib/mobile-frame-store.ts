export const mobileFrames = new Map<string, { frameData: string; timestamp: number }>();

export function storeMobileFrame(sessionId: string, frameData: string) {
    mobileFrames.set(sessionId, {
        frameData,
        timestamp: Date.now()
    });
}
