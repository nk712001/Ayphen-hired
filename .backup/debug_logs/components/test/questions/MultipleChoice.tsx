import React from 'react';
import { MultipleChoiceQuestion } from '../QuestionTypes';

interface MultipleChoiceProps {
  question: MultipleChoiceQuestion;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  question,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{question.text}</p>
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`
              flex items-center p-4 rounded-lg border cursor-pointer
              ${value === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
            `}
          >
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
