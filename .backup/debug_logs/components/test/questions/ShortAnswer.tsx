import React from 'react';
import { ShortAnswerQuestion } from '../QuestionTypes';
import { Input } from '../../ui';

interface ShortAnswerProps {
  question: ShortAnswerQuestion;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const ShortAnswer: React.FC<ShortAnswerProps> = ({
  question,
  value = '',
  onChange,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!question.maxLength || newValue.length <= question.maxLength) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{question.text}</p>
      <div>
        <Input
          value={value}
          onChange={handleChange}
          disabled={disabled}
          maxLength={question.maxLength}
          placeholder="Enter your answer"
          className="w-full"
        />
        {question.maxLength && (
          <p className="mt-2 text-sm text-gray-500">
            {value.length}/{question.maxLength} characters
          </p>
        )}
      </div>
    </div>
  );
};
