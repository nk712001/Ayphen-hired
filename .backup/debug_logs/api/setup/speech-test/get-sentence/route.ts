import { NextRequest, NextResponse } from 'next/server';

// Diverse test slogans and phrases for speech recognition
const testSlogans = [
  // Tech & Innovation Slogans
  "Innovation distinguishes between a leader and a follower.",
  "Technology is best when it brings people together.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Code is poetry written in logic and creativity.",
  "Artificial intelligence is the new electricity of our time.",
  
  // Motivational & Professional Slogans
  "Excellence is not a skill but an attitude.",
  "Success is where preparation and opportunity meet.",
  "Quality is not an act but a habit we must cultivate.",
  "Leadership is about making others better as a result of your presence.",
  "Teamwork makes the dream work in every successful organization.",
  
  // Creative & Inspirational Phrases
  "Creativity is intelligence having fun with unlimited possibilities.",
  "Every expert was once a beginner who never gave up.",
  "The only way to do great work is to love what you do.",
  "Progress is impossible without change and those who cannot change their minds.",
  "Believe you can and you are halfway to achieving your goals.",
  
  // Business & Communication Slogans
  "Communication is the key that unlocks every door to success.",
  "Customer satisfaction is our highest priority and greatest achievement.",
  "Integrity is doing the right thing when nobody is watching you.",
  "Collaboration creates solutions that individual effort cannot achieve alone.",
  "Continuous learning is the minimum requirement for success in any field.",
  
  // Classic Tongue Twisters (for pronunciation testing)
  "She sells seashells by the seashore on sunny summer days.",
  "Peter Piper picked a peck of pickled peppers perfectly.",
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
  "Red leather yellow leather makes for difficult pronunciation practice.",
  "Unique New York newspaper advertisements attract attention from readers.",
  
  // Professional Development Phrases
  "Adaptability and resilience are essential skills for modern professionals.",
  "Data-driven decisions lead to better outcomes and sustainable growth.",
  "Emotional intelligence is as important as technical expertise in leadership.",
  "Diversity and inclusion strengthen teams and drive innovation forward.",
  "Sustainable practices ensure long-term success for future generations."
];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { session_id } = data;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Always try AI service first, fall back to mock data if it fails
    console.log(`Getting test sentence for session: ${session_id}`);
    
    // Production implementation - call the AI service
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://localhost:8000';
    
    try {
      const response = await fetch(`${aiServiceUrl}/api/speech-test/get-sentence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id,
        }),
        // Add timeout and SSL options
        signal: AbortSignal.timeout(5000), // 5 second timeout
        // @ts-ignore - Node.js specific options for self-signed certificates
        ...(process.env.NODE_ENV === 'development' && {
          agent: new (require('https').Agent)({
            rejectUnauthorized: false
          })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AI service error:', errorData);
        return NextResponse.json(
          { error: 'Failed to get test sentence', details: errorData },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error calling AI service:', error);
      
      // Fallback to mock data if AI service is unavailable
      const randomIndex = Math.floor(Math.random() * testSlogans.length);
      return NextResponse.json({
        status: 'success',
        sentence: testSlogans[randomIndex]
      });
    }
  } catch (error) {
    console.error('Error getting test sentence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
