'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Flag, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionStatus {
  id: string;
  order: number;
}

interface TestNavigationProps {
  questions: Array<{
    id: string;
    order: number;
    type: string;
  }>;
  currentIndex: number;
  answers: Record<string, any>;
  flaggedQuestions: Set<string>;
  onQuestionSelect: (index: number) => void;
  className?: string;
}

export default function TestNavigation({
  questions,
  currentIndex,
  answers,
  flaggedQuestions,
  onQuestionSelect,
  className,
}: TestNavigationProps) {
  // Group questions by section if needed (for future use)
  const sections = [
    {
      title: 'Questions',
      questions: questions,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Question Navigator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              {section.title && (
                <h4 className="text-sm font-medium text-muted-foreground">
                  {section.title}
                </h4>
              )}
              <div className="grid grid-cols-5 gap-2">
                {section.questions.map((question, index) => {
                  const isCurrent = currentIndex === index;
                  const isAnswered = !!answers[question.id];
                  const isFlagged = flaggedQuestions.has(question.id);
                  const questionNumber = index + 1;

                  return (
                    <Button
                      key={question.id}
                      variant={isCurrent ? 'default' : 'outline'}
                      size="icon"
                      className={cn(
                        'h-10 w-10 relative',
                        isCurrent && 'ring-2 ring-offset-2 ring-primary',
                        isFlagged && !isCurrent && 'border-amber-500 text-amber-600',
                      )}
                      onClick={() => onQuestionSelect(index)}
                      aria-label={`Question ${questionNumber}${isAnswered ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}
                    >
                      {isAnswered ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : isFlagged ? (
                        <Flag className="h-4 w-4" />
                      ) : (
                        <span>{questionNumber}</span>
                      )}
                      
                      {isFlagged && !isCurrent && (
                        <span className="sr-only">Flagged</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-primary mr-2" />
              <span className="text-xs text-muted-foreground">Current</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-muted-foreground">Answered</span>
            </div>
            <div className="flex items-center">
              <Flag className="h-3 w-3 text-amber-500 mr-1" />
              <span className="text-xs text-muted-foreground">Flagged</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
