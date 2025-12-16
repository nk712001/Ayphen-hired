'use client';
import React, { useEffect, useRef, useState } from 'react';

// Usage: /test/webrtc-examiner?sessionId=abc123
export default function WebRTCExaminerPage() {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingRef = useRef<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Parse sessionId from URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sessionId') || '';
    setSessionId(sid);
    if (!sid) return;

    // --- WebRTC setup ---
    const pc = new RTCPeerConnection();
    peerConnectionRef.current = pc;
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ type: 'ice', sessionId: sid, candidate: event.candidate });
      }
    };

    // --- Signaling ---
    const ws = new WebSocket('ws://localhost:8080');
    signalingRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', sessionId: sid }));
    };
    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ type: 'answer', sessionId: sid, answer });
        } else if (msg.type === 'ice') {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
      } catch {}
    };
    ws.onerror = (e) => console.error('Signaling error', e);
    ws.onclose = () => console.log('Signaling closed');

    function sendSignal(msg: any) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    }

    return () => {
      ws.close();
      pc.close();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div style={{ padding: 32 }}>
      <h1>Examiner WebRTC View</h1>
      <video ref={videoRef} autoPlay playsInline style={{ width: 480, height: 320, background: '#222' }} />
      <div>Session ID: {sessionId}</div>
    </div>
  );
}
