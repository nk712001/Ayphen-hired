import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc } from 'socket.io-client';
import { ProctorClient } from '@/lib/proctoring/ProctorClient';
import { SecretsManager } from '@/lib/config/secrets';
import { RBACManager } from '@/lib/auth/rbac';

describe('Security API Integration', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: any;
  let httpServer: any;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = ioc(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  describe('WebSocket Security', () => {
    let proctorClient: ProctorClient;
    const mockViolation = jest.fn();
    const mockMetrics = jest.fn();
    const mockConnection = jest.fn();

    beforeEach(() => {
      proctorClient = new ProctorClient(
        'test-session',
        mockViolation,
        mockMetrics,
        mockConnection
      );
    });

    it('should establish secure WebSocket connection', (done) => {
      serverSocket.on('connection', (socket: any) => {
        expect(socket.handshake.secure).toBe(true);
        done();
      });

      proctorClient.connect();
    });

    it('should handle binary data transfer', (done) => {
      const testData = new ArrayBuffer(8);
      serverSocket.on('video-frame', (data: ArrayBuffer) => {
        expect(data).toBeInstanceOf(ArrayBuffer);
        done();
      });

      proctorClient.sendVideoFrame(testData);
    });

    it('should validate protocol version', (done) => {
      serverSocket.on('connection', (socket: any) => {
        expect(socket.protocol).toBe('v1.proctoring.secure');
        done();
      });

      proctorClient.connect();
    });
  });

  describe('Authentication Integration', () => {
    let secretsManager: SecretsManager;
    let rbacManager: RBACManager;

    beforeEach(async () => {
      secretsManager = SecretsManager.getInstance();
      await secretsManager.initialize();
      rbacManager = RBACManager.getInstance();
    });

    it('should handle JWT authentication flow', async () => {
      const jwtSecret = secretsManager.getAppSecret('JWT_SECRET');
      expect(jwtSecret).toBeDefined();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpass',
        }),
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.token).toBeDefined();
    });

    it('should enforce RBAC permissions', async () => {
      rbacManager.setUserRole('student');

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(403);
    });

    it('should validate API keys', async () => {
      const apiKey = secretsManager.getAppSecret('API_KEY');
      
      const response = await fetch('/api/secure-endpoint', {
        headers: apiKey ? {
          'X-API-Key': apiKey
        } : undefined,
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Media Stream Security', () => {
    it('should enforce secure media constraints', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          frameRate: 10,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      expect(stream.getVideoTracks()).toHaveLength(1);
      expect(stream.getAudioTracks()).toHaveLength(1);

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      expect(settings.width).toBeLessThanOrEqual(640);
      expect(settings.height).toBeLessThanOrEqual(480);
      expect(settings.frameRate).toBeLessThanOrEqual(10);
    });

    it('should handle media stream cleanup', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      videoTrack.stop();
      audioTrack.stop();

      expect(videoTrack.readyState).toBe('ended');
      expect(audioTrack.readyState).toBe('ended');
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket connection errors', (done) => {
      const mockError = new Error('Connection failed');
      serverSocket.on('error', mockError);

      clientSocket.on('error', (error: Error) => {
        expect(error.message).toBe('Connection failed');
        done();
      });

      serverSocket.emit('error', mockError);
    });

    it('should handle authentication failures', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'invalid',
          password: 'invalid',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle media stream errors', async () => {
      try {
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: 999999, // Invalid constraint
          },
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
