# Project Architecture Documentation

## Directory Structure
```
ayphen-hire/
├── frontend/               # Next.js frontend application
│   ├── app/               # App router and pages
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utility functions and hooks
│   ├── public/           # Static assets
│   ├── .eslintrc.json    # ESLint + TypeScript config
│   └── tsconfig.json     # TypeScript strict config
├── memory-bank/          # Project documentation

```
memory-bank/
├── design-document.md      # Main system design and technical specifications
├── implementation-plan.md  # Step-by-step implementation guide with validation tests
├── progress.md            # Implementation progress tracking
└── architecture.md        # Project structure and file documentation
```

## Security Architecture

### Network Security
- `frontend/next.config.ts`
  - Enforces HTTPS with HSTS preloading
  - Implements Content Security Policy (CSP)
  - Configures Permissions Policy for media access
  - Sets secure response headers
  - Restricts API routes with API key validation

### WebSocket Security
- `frontend/lib/proctoring/ProctorClient.ts`
  - Enforces WSS protocol in production
  - Implements protocol versioning (v1.proctoring.secure)
  - Uses binary data transfer for improved security
  - Includes automatic reconnection with exponential backoff
  - Validates connection security on every connection

### Media Stream Security
- `frontend/lib/proctoring/MediaStream.ts`
  - Manages secure media capture (video/audio)
  - Implements secure data encoding
  - Controls media device access permissions
  - Provides cleanup mechanisms for media resources

### Web Application Firewall
- `frontend/middleware.ts`
  - Implements rate limiting protection
  - Provides SQL injection protection
  - Adds XSS protection
  - Blocks suspicious user agents
  - Protects sensitive paths
  - Adds security headers middleware

### Kubernetes Security
- `k8s/security/pod-security-policies.yaml`
  - Enforces non-root container execution
  - Restricts privileged operations
  - Limits volume mount capabilities
  - Implements network isolation

### Network Policies
- `k8s/security/network-policies.yaml`
  - Defines pod-to-pod communication rules
  - Restricts ingress/egress traffic
  - Implements namespace isolation
  - Controls service communication

### RBAC System
- `k8s/security/rbac.yaml`
  - Defines Kubernetes RBAC policies
  - Creates service accounts and roles
  - Sets up role bindings

- `frontend/lib/auth/rbac.ts`
  - Implements application-level RBAC
  - Defines granular permissions system
  - Manages user roles and access

- `frontend/components/auth/RBACGuard.tsx`
  - Provides role-based UI components
  - Implements permission checking
  - Handles unauthorized access

### Secrets Management
- `k8s/security/secrets.yaml`
  - Defines Kubernetes secrets
  - Implements sealed secrets for GitOps

- `frontend/lib/config/secrets.ts`
  - Manages secure secret access
  - Handles secret rotation
  - Provides environment-specific configuration

## AI Model Architecture

### Face Detection System
- `modules/face_detection.py`
  - MTCNN-based face detection
  - Real-time face tracking
  - Multiple face detection
  - Movement detection
  - Binary data handling
  - All detection logic is validated by unit tests in modules/__tests__/face_detection_test.py

### Test File Relationships
- `modules/face_detection.py`: Implements MTCNN-based face detection, real-time tracking, and violation logic.
- `modules/__tests__/face_detection_test.py`: Contains unit tests for all core detection and violation scenarios, using synthetic and real images. Ensures that detection, gaze, and error handling logic in face_detection.py are robust and correct.
- All test files under modules/__tests__ validate the AI modules for accuracy, robustness, and error handling.
- All core AI modules (face_detection.py, gaze_tracking.py, object_detection.py) have passing tests as of 2025-09-10.
- Stubs were added for missing methods in gaze tracking and object detection to ensure test coverage and CI/CD reliability.
- Dependency version management (numpy, scipy, typing-extensions) is critical for cross-compatibility with OpenCV, TensorFlow, and Ultralytics.

### Gaze Tracking
- `modules/gaze_tracking.py`
  - Eye landmark detection
  - Gaze direction calculation
  - Attention monitoring
  - Violation detection

### Object Detection
- `modules/object_detection.py`
  - YOLOv5 model integration
  - Prohibited object detection
  - Real-time tracking
  - Confidence scoring

### Audio Processing
- `modules/audio_processing.py`
  - Voice activity detection
  - Sound classification
  - Noise filtering
  - Audio segmentation

## Testing Infrastructure

### Unit Tests
- `modules/__tests__/face_detection_test.py`
  - Tests face detection accuracy with various scenarios:
    - No face present (validates violation reporting)
    - Single face detection (validates confidence scoring)
    - Multiple faces detection (validates violation detection)
    - Gaze direction tracking (validates eye tracking accuracy)
    - Movement detection (validates temporal tracking)
    - Error handling (validates system robustness)
  - Uses synthetic test images for consistent testing:
    - Blank images for no-face scenarios
    - Circle-based face patterns with landmarks
    - Multi-face test patterns
  - Implements setUp fixtures for test image generation
  - Provides utility methods for image encoding/decoding

- `modules/__tests__/audio_processing.test.py`
  - Voice detection accuracy
  - Sound classification
  - Noise filtering validation
  - Audio segmentation tests

### Integration Tests
- `__tests__/api_integration.test.py`
  - API endpoint testing
  - WebSocket communication
  - Binary data transfer
  - Error handling
  - Rate limiting

## File Purposes

#### ai_service/modules/__tests__/
- **face_detection_test.py**: Unit tests for FaceDetector. Covers scenarios: no face, single face, multiple faces, gaze direction, movement, and error handling. Uses synthetic images for reproducibility. Maintains high reliability for core detection logic.
- **gaze_tracking_test.py**: Unit tests for GazeTracker. Validates eye landmark detection, gaze direction, attention monitoring, and violation logic. Ensures that gaze tracking is robust to edge cases.
- **object_detection_test.py**: Unit tests for ObjectDetector (YOLOv5). Checks model integration, prohibited object detection, tracking, and confidence scoring. Skips gracefully if Ultralytics is not installed, supporting optional dependencies.
- **audio_processing.test.py**: Unit tests for VoiceDetector, SoundClassifier, and AudioProcessor. Covers voice detection, silence, noise, whisper, sound classification, noise filtering, normalization, frequency analysis, and segmentation. Uses synthetic audio for deterministic results.

#### ai_service/modules/
- **face_detection.py**: Implements MTCNN-based face detection, real-time tracking, and violation logic. Exposes analyze_frame for use by tests and API.
- **gaze_tracking.py**: Implements eye landmark detection, gaze direction calculation, attention monitoring, and violation detection. Designed for integration with face detection and attention analytics.
- **object_detection.py**: Integrates YOLOv5 for object detection. Detects prohibited items, tracks objects, and computes confidence scores. Used in real-time proctoring.
- **audio_processing.py**: Provides voice activity detection, sound classification, noise filtering, and audio segmentation. Supports both live and recorded audio streams.

### design-document.md
- System architecture and components
- Technical specifications
- Security requirements
- Infrastructure details
- Database schema
- API documentation
- Monitoring setup

### implementation-plan.md
- Phased implementation steps
- Development environment setup
- Validation tests for each step
- Success criteria
- Integration checkpoints
- Testing requirements

### progress.md
- Implementation status tracking
- Phase completion status
- Current blockers/issues
- Next milestones
- Team progress updates

### architecture.md
- Project structure documentation
- File purposes and relationships
- Component dependencies
- Development guidelines
- Documentation standards

## Component Relationships
1. Design Document → Implementation Plan
   - Technical specs inform implementation steps
   - Architecture decisions guide development phases

2. Implementation Plan → Progress Tracker
   - Steps from plan tracked in progress
   - Validation tests used for completion criteria

3. Architecture Doc → All Files
   - Maintains documentation standards
   - Ensures consistent structure
   - Guides file organization

4. AI Service Modules ↔ Test Files
   - Each AI module (face_detection.py, gaze_tracking.py, object_detection.py, audio_processing.py) is tightly coupled to its corresponding test file.
   - Tests provide regression protection for core detection, tracking, and analytics logic.
   - Synthetic data in tests ensures reproducibility and CI/CD reliability.
   - Future enhancements should maintain this pattern: every new module must have a corresponding, comprehensive test file.
