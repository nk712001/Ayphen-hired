import React, { useCallback } from 'react';
import { FileUploadQuestion } from '../QuestionTypes';

interface FileUploadProps {
  question: FileUploadQuestion;
  value?: File;
  onChange: (file: File | undefined) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  question,
  value,
  onChange,
  disabled = false,
}) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        onChange(file);
      }
    },
    [disabled, onChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidFile(file)) {
        onChange(file);
      }
    },
    [onChange]
  );

  const isValidFile = (file: File): boolean => {
    const isValidType = question.allowedTypes.some(type => 
      file.type.toLowerCase().includes(type.toLowerCase())
    );
    const isValidSize = file.size <= question.maxSize;

    return isValidType && isValidSize;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{question.text}</p>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-blue-500 cursor-pointer'}
          ${value ? 'border-green-500 bg-green-50' : 'border-gray-300'}
        `}
      >
        {value ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">File uploaded:</p>
            <p className="font-medium">{value.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(value.size)}</p>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              disabled={disabled}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <label
                htmlFor={`file-upload-${question.id}`}
                className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
              >
                <span>Upload a file</span>
                <input
                  id={`file-upload-${question.id}`}
                  type="file"
                  className="sr-only"
                  onChange={handleFileInput}
                  disabled={disabled}
                  accept={question.allowedTypes.join(',')}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              Allowed types: {question.allowedTypes.join(', ')}
            </p>
            <p className="text-xs text-gray-500">
              Maximum size: {formatFileSize(question.maxSize)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
