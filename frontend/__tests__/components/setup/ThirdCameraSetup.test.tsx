import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThirdCameraSetup from '@/components/setup/ThirdCameraSetup';
import { ProctoringProvider } from '@/lib/proctoring/proctoring-context';

// Mock the proctoring context
jest.mock('@/lib/proctoring/proctoring-context', () => ({
  useProctoring: () => ({
    startProctoring: jest.fn().mockResolvedValue(undefined),
    isProctoringActive: true,
    isCameraActive: true,
    videoRef: { current: document.createElement('video') },
    stream: new MediaStream(),
  }),
  ProctoringProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock fetch for API calls
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ position_valid: true, stability_score: 0.9 }),
  })
);

describe('ThirdCameraSetup Component', () => {
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the intro step correctly', () => {
    render(
      <ProctoringProvider>
        <ThirdCameraSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />
      </ProctoringProvider>
    );

    expect(screen.getByText('Secondary Camera Setup')).toBeInTheDocument();
    expect(screen.getByText('For enhanced proctoring, we'll set up a secondary camera to monitor your workspace.')).toBeInTheDocument();
    expect(screen.getByText('What you'll need:')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('allows skipping when not required', () => {
    render(
      <ProctoringProvider>
        <ThirdCameraSetup onComplete={mockOnComplete} onSkip={mockOnSkip} isRequired={false} />
      </ProctoringProvider>
    );

    const skipButton = screen.getByText('Skip');
    fireEvent.click(skipButton);
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('does not allow skipping when required', () => {
    render(
      <ProctoringProvider>
        <ThirdCameraSetup onComplete={mockOnComplete} onSkip={mockOnSkip} isRequired={true} />
      </ProctoringProvider>
    );

    expect(screen.queryByText('Skip')).not.toBeInTheDocument();
  });

  it('proceeds to primary camera step when start button is clicked', () => {
    render(
      <ProctoringProvider>
        <ThirdCameraSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />
      </ProctoringProvider>
    );

    const startButton = screen.getByText('Start Setup');
    fireEvent.click(startButton);
    
    expect(screen.getByText('Primary Camera Setup')).toBeInTheDocument();
    expect(screen.getByText('Position yourself in front of your primary camera.')).toBeInTheDocument();
  });
});
