export class MediaStreamHandler {
  private videoStream: MediaStream | null = null;
  private audioStream: MediaStream | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private audioTrack: MediaStreamTrack | null = null;
  private videoCanvas: HTMLCanvasElement;
  private videoContext: CanvasRenderingContext2D;
  private frameRate = 10;
  private frameInterval: number | null = null;
  private audioContext: AudioContext | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;

  constructor() {
    this.videoCanvas = document.createElement('canvas');
    this.videoCanvas.width = 640;
    this.videoCanvas.height = 480;
    const context = this.videoCanvas.getContext('2d');
    if (!context) throw new Error('Failed to get canvas context');
    this.videoContext = context;
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      // Request both video and audio permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          frameRate: this.frameRate,
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Split into separate streams
      this.videoStream = new MediaStream([stream.getVideoTracks()[0]]);
      this.audioStream = new MediaStream([stream.getAudioTracks()[0]]);
      this.videoTrack = this.videoStream.getVideoTracks()[0];
      this.audioTrack = this.audioStream.getAudioTracks()[0];

      return true;
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      return false;
    }
  }

  public startVideoCapture(onFrame: (frameData: string) => void): void {
    if (!this.videoTrack) {
      throw new Error('Video track not initialized');
    }

    // Create video element for capturing frames
    const video = document.createElement('video');
    video.srcObject = this.videoStream;
    video.play();

    // Capture frames at specified interval
    this.frameInterval = window.setInterval(() => {
      this.videoContext.drawImage(video, 0, 0, this.videoCanvas.width, this.videoCanvas.height);
      const frameData = this.videoCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      onFrame(frameData);
    }, 1000 / this.frameRate);
  }

  public startAudioCapture(onFrame: (frameData: string) => void): void {
    if (!this.audioTrack) {
      throw new Error('Audio track not initialized');
    }

    // Initialize audio context
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.audioStream!);
    
    // Create script processor for audio analysis
    this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.audioProcessor.onaudioprocess = (e) => {
      const audioData = e.inputBuffer.getChannelData(0);
      // Convert audio data to base64
      const buffer = new Float32Array(audioData);
      const bytes = new Uint8Array(buffer.buffer);
      const base64 = btoa(Array.from(bytes).map(byte => String.fromCharCode(byte)).join(''));
      onFrame(base64);
    };

    // Connect audio nodes
    source.connect(this.audioProcessor);
    this.audioProcessor.connect(this.audioContext.destination);
  }

  public stopVideoCapture(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    this.videoTrack?.stop();
  }

  public stopAudioCapture(): void {
    this.audioProcessor?.disconnect();
    this.audioContext?.close();
    this.audioTrack?.stop();
  }

  public cleanup(): void {
    this.stopVideoCapture();
    this.stopAudioCapture();
    this.videoStream = null;
    this.audioStream = null;
    this.videoTrack = null;
    this.audioTrack = null;
  }
}
