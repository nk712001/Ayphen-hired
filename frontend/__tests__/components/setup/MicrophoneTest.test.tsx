import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MicrophoneTest from '@/components/setup/MicrophoneTest';
import { ProctoringProvider } from '@/lib/proctoring/proctoring-context';

// Mock the proctoring context
jest.mock('@/lib/proctoring/proctoring-context', () => ({
  useProctoring: () => ({
    startProctoring: jest.fn().mockResolvedValue(undefined),
    isProctoringActive: true,
    isMicrophoneActive: true,
    toggleMicrophone: jest.fn(),
  }),
  ProctoringProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  state: 'inactive',
};

window.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder);

// Mock fetch for API calls
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      status: 'complete',
      audio_quality: { overall_quality: 0.85, volume_level: 0.9, clarity: 0.8, background_noise_level: 0.1 },
      recognition_accuracy: 0.9,
      is_acceptable: true,
      message: 'Good audio quality. Your voice is clear and recognizable.'
    }),
  })
);

describe('MicrophoneTest Component', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the intro step correctly', () => {
    render(
      <ProctoringProvider>
        <MicrophoneTest onComplete={mockOnComplete} />
      </ProctoringProvider>
    );

    expect(screen.getByText('Microphone & Voice Recognition Test')).toBeInTheDocument();
    expect(screen.getByText('Let's test your microphone and voice recognition capabilities.')).toBeInTheDocument();
    expect(screen.getByText('What we'll test:')).toBeInTheDocument();
    expect(screen.getByText('Start Test')).toBeInTheDocument();
  });

  it('proceeds to permission step when start button is clicked', () => {
    render(
      <ProctoringProvider>
        <MicrophoneTest onComplete={mockOnComplete} />
      </ProctoringProvider>
    );

    const startButton = screen.getByText('Start Test');
    fireEvent.click(startButton);
    
    expect(screen.getByText('Microphone Access')).toBeInTheDocument();
    expect(screen.getByText('Please allow access to your microphone.')).toBeInTheDocument();
  });

  it('shows microphone active status when microphone is active', () => {
    render(
      <ProctoringProvider>
        <MicrophoneTest onComplete={mockOnComplete} />
      </ProctoringProvider>
    );

    // Navigate to permission step
    const startButton = screen.getByText('Start Test');
    fireEvent.click(startButton);
    
    expect(screen.getByText('Microphone Active')).toBeInTheDocument();
    expect(screen.getByText('Your microphone is working properly.')).toBeInTheDocument();
  });
});
