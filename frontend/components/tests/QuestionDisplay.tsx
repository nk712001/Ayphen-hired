'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type QuestionType = 'multiple_choice' | 'short_answer' | 'essay' | 'code' | 'file_upload';

interface QuestionProps {
  question: {
    id: string;
    type: QuestionType;
    text: string;
    metadata: any;
    required?: boolean;
  };
  value: any;
  onChange: (value: any) => void;
  className?: string;
}

export default function QuestionDisplay({ question, value, onChange, className }: QuestionProps) {
  const [localValue, setLocalValue] = useState(value || '');
  
  // Update local value when the prop changes or question changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value, question.id]);

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            value={localValue}
            onChange={handleChange}
          />
        );
      case 'short_answer':
        return (
          <ShortAnswerQuestion
            question={question}
            value={localValue}
            onChange={handleChange}
          />
        );
      case 'essay':
        return (
          <EssayQuestion
            question={question}
            value={localValue}
            onChange={handleChange}
          />
        );
      case 'code':
        return (
          <CodeQuestion
            question={question}
            value={localValue}
            onChange={handleChange}
          />
        );
      case 'file_upload':
        return (
          <FileUploadQuestion
            question={question}
            value={localValue}
            onChange={handleChange}
          />
        );
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <h3 className="text-lg font-medium mb-4">
          {question.text}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {question.metadata?.description && (
          <div className="text-muted-foreground mb-6">
            {question.metadata.description}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        {renderQuestionContent()}
      </div>
    </div>
  );
}

// Multiple Choice Question Component
function MultipleChoiceQuestion({ question, value, onChange }: QuestionProps) {
  const options = question.metadata?.options || [];
  const isMultiple = question.metadata?.multiple || false;

  if (isMultiple) {
    const selected = new Set(value || []);
    
    const handleCheckboxChange = (optionValue: string) => {
      const newSelected = new Set(selected);
      if (newSelected.has(optionValue)) {
        newSelected.delete(optionValue);
      } else {
        newSelected.add(optionValue);
      }
      onChange(Array.from(newSelected));
    };

    return (
      <div className="space-y-3">
        {options.map((option: string, index: number) => (
          <div key={index} className="flex items-center space-x-3">
            <Checkbox
              id={`${question.id}-${index}`}
              checked={selected.has(option)}
              onCheckedChange={() => handleCheckboxChange(option)}
            />
            <Label htmlFor={`${question.id}-${index}`} className="text-base font-normal">
              {option}
            </Label>
          </div>
        ))}
      </div>
    );
  }

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="space-y-3"
    >
      {options.map((option: string, index: number) => (
        <div key={index} className="flex items-center space-x-3">
          <RadioGroupItem value={option} id={`${question.id}-${index}`} />
          <Label htmlFor={`${question.id}-${index}`} className="text-base font-normal">
            {option}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

// Short Answer Question Component
function ShortAnswerQuestion({ question, value, onChange }: QuestionProps) {
  const maxLength = question.metadata?.maxLength || 100;
  
  return (
    <div className="space-y-2">
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder="Type your answer here..."
      />
      <div className="text-xs text-muted-foreground text-right">
        {value?.length || 0}/{maxLength} characters
      </div>
    </div>
  );
}

// Essay Question Component
function EssayQuestion({ question, value, onChange }: QuestionProps) {
  const minWords = question.metadata?.minWords || 50;
  const maxWords = question.metadata?.maxWords || 500;
  const [wordCount, setWordCount] = useState(0);
  
  const handleTextChange = (text: string) => {
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    setWordCount(words.length);
    onChange(text);
  };

  const isWordCountValid = wordCount >= minWords && wordCount <= maxWords;
  
  return (
    <div className="space-y-2">
      <Textarea
        value={value || ''}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Type your essay here..."
        rows={8}
        className="min-h-[200px]"
      />
      <div 
        className={cn(
          'text-xs text-right',
          isWordCountValid ? 'text-muted-foreground' : 'text-amber-600'
        )}
      >
        {wordCount} words ({minWords}-{maxWords} words required)
      </div>
      {question.metadata?.formattingHelp && (
        <div className="text-xs text-muted-foreground mt-1">
          {question.metadata.formattingHelp}
        </div>
      )}
    </div>
  );
}

// Code Question Component
function CodeQuestion({ question, value, onChange }: QuestionProps) {
  const [code, setCode] = useState(value || '');
  const language = question.metadata?.language || 'javascript';
  
  // Reset code when question changes or when value is cleared
  useEffect(() => {
    setCode(value || '');
  }, [value, question.id]);
  
  // In a real implementation, you would use a proper code editor component
  // like Monaco Editor or CodeMirror for better code editing experience
  
  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="// Write your code here..."
          className="font-mono text-sm min-h-[200px]"
        />
        <div className="absolute top-2 right-2 bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground">
          {language}
        </div>
      </div>
      
      {question.metadata?.testCases && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Test Cases</h4>
          <div className="space-y-2">
            {question.metadata.testCases.map((testCase: any, index: number) => (
              <div key={index} className="text-xs p-2 bg-muted/50 rounded">
                <div className="font-medium">Test Case {index + 1}</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <div className="text-muted-foreground">Input:</div>
                    <div className="font-mono bg-background p-1 rounded">
                      {testCase.input}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Expected Output:</div>
                    <div className="font-mono bg-background p-1 rounded">
                      {testCase.expectedOutput}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// File Upload Question Component
function FileUploadQuestion({ question, value, onChange }: QuestionProps) {
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const allowedTypes = question.metadata?.allowedTypes || [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert(`Please upload a file of type: ${allowedTypes.join(', ')}`);
      return;
    }
    
    // Check file size (default 5MB)
    const maxSize = (question.metadata?.maxSize || 5) * 1024 * 1024; // MB to bytes
    if (file.size > maxSize) {
      alert(`File size must be less than ${question.metadata?.maxSize || 5}MB`);
      return;
    }
    
    setFileName(file.name);
    setIsUploading(true);
    
    try {
      // In a real implementation, you would upload the file to a storage service
      // and save the URL or file ID as the answer
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/upload', { method: 'POST', body: formData });
      // const { url } = await response.json();
      // onChange(url);
      
      // For demo purposes, we'll just use a fake URL
      setTimeout(() => {
        const fakeUrl = `https://example.com/uploads/${file.name}`;
        onChange(fakeUrl);
        setIsUploading(false);
      }, 1000);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
      setIsUploading(false);
    }
  };
  
  const handleRemoveFile = () => {
    setFileName('');
    onChange(null);
  };

  if (fileName || value) {
    return (
      <div className="border rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium">
              {fileName || value?.split('/').pop()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            disabled={isUploading}
          >
            Remove
          </Button>
        </div>
        {isUploading && (
          <div className="mt-2 text-sm text-muted-foreground">
            Uploading...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <label
        className={cn(
          'px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isUploading ? 'Uploading...' : 'Choose File'}
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
          accept={question.metadata?.allowedTypes?.join(',')}
        />
      </label>
      <span className="ml-3 text-sm text-muted-foreground">
        {question.metadata?.description || 'Upload your file here'}
      </span>
    </div>
  );
}
