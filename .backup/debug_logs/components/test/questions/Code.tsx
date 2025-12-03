import React from 'react';
import { CodeQuestion } from '../QuestionTypes';

interface CodeProps {
  question: CodeQuestion;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const Code: React.FC<CodeProps> = ({
  question,
  value = question.boilerplate || '',
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{question.text}</p>
      <div className="relative">
        <div className="absolute top-0 right-0 px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-tr-lg rounded-bl-lg">
          {question.language}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={12}
          className={`
            w-full px-4 py-2 font-mono text-sm
            rounded-lg border border-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
          style={{ tabSize: 2 }}
        />
      </div>
      {question.testCases && question.testCases.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Test Cases:</h4>
          <div className="space-y-2">
            {question.testCases.map((testCase, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Input:</p>
                    <pre className="mt-1 text-sm">{testCase.input}</pre>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Expected Output:</p>
                    <pre className="mt-1 text-sm">{testCase.expectedOutput}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
