import React from 'react';
import { Card, CardContent } from '../ui/card';

interface TestLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const TestLayout: React.FC<TestLayoutProps> = ({
  children,
  header,
  sidebar,
}) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      {header && (
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {header}
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            <Card className="w-full">
              <CardContent className="p-6">
                {children}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          {sidebar && (
            <div className="w-80">
              <Card className="w-full">
                <CardContent className="p-4">
                  {sidebar}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
