"use client";

import React, { useEffect, useState } from 'react';
import { EssayQuestion } from '../QuestionTypes';

interface EssayProps {
  question: EssayQuestion;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const Essay: React.FC<EssayProps> = ({
  question,
  value = '',
  onChange,
  disabled = false,
}) => {
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [value]);

  const isUnderMinWords = question.minWords && wordCount < question.minWords;
  const isOverMaxWords = question.maxWords && wordCount > question.maxWords;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{question.text}</p>
      <div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={8}
          className={`
            w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2
            ${isUnderMinWords || isOverMaxWords ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
          placeholder="Write your answer here..."
        />
        <div className="mt-2 flex justify-between text-sm">
          <span className={wordCount === 0 ? 'text-gray-500' : 'text-gray-700'}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          {(question.minWords || question.maxWords) && (
            <span className="text-gray-500">
              {question.minWords && `Min: ${question.minWords} words`}
              {question.minWords && question.maxWords && ' | '}
              {question.maxWords && `Max: ${question.maxWords} words`}
            </span>
          )}
        </div>
        {isUnderMinWords && (
          <p className="mt-1 text-sm text-red-600">
            Please write at least {question.minWords} words
          </p>
        )}
        {isOverMaxWords && (
          <p className="mt-1 text-sm text-red-600">
            Please keep your answer under {question.maxWords} words
          </p>
        )}
      </div>
    </div>
  );
};
