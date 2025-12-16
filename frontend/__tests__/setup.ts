// Add type definitions for global scope
declare global {
  // Remove duplicate Cypress declaration to avoid conflicts
  interface Window {
    // Cypress will be available in the global scope
  }
  
  namespace NodeJS {
    interface Global {
      WebSocket: typeof WebSocket;
      navigator: Navigator;
      document: Document;
      cy: any; // Using any to avoid Cypress type conflicts
      fetch: typeof fetch;
      Request: typeof Request;
      Response: typeof Response;
    }
  }
}

import '@testing-library/jest-dom';

// Mock fetch, Request, and Response for Jest (Node)
if (!global.fetch) {
  global.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const status = (init as any)?.status || 200;
    const body = init?.body ? JSON.parse(init.body as string) : {};
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: '',
      headers: new Headers(),
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    } as Response);
  };
}

if (!global.Request) {
  global.Request = class MockRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      return {
        ...(input as object),
        ...(init || {})
      } as unknown as Request;
    }
  } as unknown as typeof Request;
}

if (!global.Response) {
  global.Response = class MockResponse {
    status: number;
    ok: boolean;
    body: any;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.body = body;
    }

    json() {
      return Promise.resolve(this.body ? JSON.parse(this.body as string) : {});
    }

    text() {
      return Promise.resolve(this.body ? this.body.toString() : '');
    }
  } as unknown as typeof Response;
}

import 'jest-websocket-mock';

// Mock WebSocket
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = MockWebSocket.CONNECTING;
  readonly OPEN = MockWebSocket.OPEN;
  readonly CLOSING = MockWebSocket.CLOSING;
  readonly CLOSED = MockWebSocket.CLOSED;

  binaryType: BinaryType = 'blob';
  bufferedAmount = 0;
  extensions = '';
  protocol = '';
  readyState: number = WebSocket.CONNECTING;
  // Update type to match WebSocket's onopen signature
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string, protocols?: string | string[]) {
    this.protocol = Array.isArray(protocols) ? protocols[0] : protocols || '';
    // Use arrow function to preserve 'this' context
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      const openEvent = new Event('open');
      if (this.onopen) {
        // Use Function.prototype.call to set the correct 'this' context
        this.onopen.call(this, openEvent);
      }
      // Also dispatch the event for any event listeners
      this.dispatchEvent(openEvent);
    }, 0);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }

  // Required for EventTarget interface
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {}
  dispatchEvent(event: Event): boolean { return true; }
}

// Mock MediaStreamTrack
class MockMediaStreamTrack {
  kind: string;
  id: string;
  enabled: boolean = true;
  muted: boolean = false;
  onmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  onunmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  onended: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  readyState: MediaStreamTrackState = 'live';
  contentHint: string = '';
  label: string = '';

  constructor(kind: 'audio' | 'video') {
    this.kind = kind;
    this.id = `mock-${kind}-track-${Math.random().toString(36).substr(2, 9)}`;
  }

  stop(): void {
    this.readyState = 'ended';
    this.onended?.(new Event('ended'));
  }

  getSettings(): MediaTrackSettings {
    return this.kind === 'video' 
      ? { width: 640, height: 480, frameRate: 10 }
      : { deviceId: this.id, groupId: 'mock-group-id' };
  }

  getConstraints(): MediaTrackConstraints {
    return {};
  }

  getCapabilities(): MediaTrackCapabilities {
    return this.kind === 'video'
      ? { width: { max: 1920, min: 640 }, height: { max: 1080, min: 480 }, frameRate: { max: 60, min: 1 } }
      : { deviceId: this.id, groupId: 'mock-group-id' };
  }

  clone(): MediaStreamTrack {
    return new MockMediaStreamTrack(this.kind as 'audio' | 'video') as unknown as MediaStreamTrack;
  }

  applyConstraints(constraints?: MediaTrackConstraints): Promise<void> {
    return Promise.resolve();
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {}
  dispatchEvent(event: Event): boolean { return true; }
}

// Mock MediaStream
class MockMediaStream {
  id: string;
  active: boolean = true;
  onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  _tracks: MediaStreamTrack[];

  constructor(tracks?: MediaStreamTrack[]) {
    this.id = `mock-stream-${Math.random().toString(36).substr(2, 9)}`;
    this._tracks = tracks || [];
  }

  getTracks(): MediaStreamTrack[] {
    return [...this._tracks];
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this._tracks.filter(track => track.kind === 'video');
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this._tracks.filter(track => track.kind === 'audio');
  }

  addTrack(track: MediaStreamTrack): void {
    this._tracks.push(track);
    this.onaddtrack?.(new MediaStreamTrackEvent('addtrack', { track }));
  }

  removeTrack(track: MediaStreamTrack): void {
    const index = this._tracks.findIndex(t => t === track);
    if (index > -1) {
      this._tracks.splice(index, 1);
      this.onremovetrack?.(new MediaStreamTrackEvent('removetrack', { track }));
    }
  }

  clone(): MediaStream {
    return new MockMediaStream([...this._tracks.map(t => t.clone())]);
  }

  getTrackById(trackId: string): MediaStreamTrack | null {
    return this._tracks.find(track => track.id === trackId) || null;
  }

  dispatchEvent(event: Event): boolean { return true; }
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {}
}

// Mock navigator.mediaDevices
const mockMediaDevices: MediaDevices = {
  ondevicechange: null,
  enumerateDevices: jest.fn().mockResolvedValue([]),
  getDisplayMedia: jest.fn().mockResolvedValue(new MockMediaStream() as unknown as MediaStream),
  getSupportedConstraints: jest.fn().mockReturnValue({
    width: true,
    height: true,
    aspectRatio: true,
    frameRate: true,
    facingMode: true,
    volume: true,
    sampleRate: true,
    sampleSize: true,
    echoCancellation: true,
    autoGainControl: true,
    noiseSuppression: true,
    latency: true,
    channelCount: true,
    deviceId: true,
    groupId: true,
  }),
  getUserMedia: jest.fn().mockImplementation((constraints) => {
    const tracks: MediaStreamTrack[] = [];
    
    if (constraints?.video) {
      const videoTrack = new MockMediaStreamTrack('video') as unknown as MediaStreamTrack;
      tracks.push(videoTrack);
    }
    
    if (constraints?.audio) {
      const audioTrack = new MockMediaStreamTrack('audio') as unknown as MediaStreamTrack;
      tracks.push(audioTrack);
    }

    return Promise.resolve(new MockMediaStream(tracks) as unknown as MediaStream);
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn().mockReturnValue(true),
} as unknown as MediaDevices;

// Setup global mockscks
global.WebSocket = MockWebSocket as typeof WebSocket;
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  configurable: true
});

interface CustomGlobal extends NodeJS.Global {
  WebSocket: typeof WebSocket;
  navigator: Navigator;
  document: Document;

  cy: Cypress.Chainable<any>;
}

declare const global: CustomGlobal;

// Mock Cypress commands
global.cy = {
  visit: jest.fn(),
  get: jest.fn(),
  contains: jest.fn(),
  login: jest.fn(),
  window: jest.fn(),
  request: jest.fn(),
  intercept: jest.fn(),
  on: jest.fn()
} as any;
