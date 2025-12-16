interface Window {
  navigator: {
    mediaDevices: {
      getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
    };
  };
  document: Document;
  postMessage: (message: any, targetOrigin: string, transfer?: Transferable[]) => void;
  WebSocket: {
    prototype: WebSocket;
    CONNECTING: number;
    OPEN: number;
    CLOSING: number;
    CLOSED: number;
  };
}
